const { Project, SyntaxKind } = require("ts-morph");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const project = new Project();
project.addSourceFilesAtPaths("src/app/**/*.tsx");

let allKeys = [];

function isIndonesianText(text) {
    if(!text) return false;
    const trimmed = text.trim();
    if(trimmed.length === 0) return false;
    if(!/[a-zA-Z]/.test(trimmed)) return false;
    if(trimmed.includes('{') || trimmed.includes('}')) return false;
    return true;
}

function generateKey(dir, text) {
    let suffix = text.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15).replace(/_+$/, '');
    if(!suffix) suffix = Math.random().toString(36).substring(7);
    return `${dir}_${suffix}_${Math.floor(Math.random() * 1000)}`;
}

async function run() {
    const sourceFiles = project.getSourceFiles();
    let totalMigrated = 0;
    
    // Only target the previously skipped files!
    const targetFiles = ["LoginClient", "RegisterClient", "BerandaClient", "EventClient", "ExportClient", "AdminLockBtn", "ProfilClient"];

    for (const sourceFile of sourceFiles) {
        const baseName = sourceFile.getBaseNameWithoutExtension();
        if(!targetFiles.includes(baseName)) continue; // ONLY process target files

        let modified = false;
        
        const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
        let extracted = [];
        
        const dirName = path.basename(path.dirname(sourceFile.getFilePath()));
        const prefix = dirName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'global';

        for (const jsxText of jsxTexts) {
            const text = jsxText.getLiteralText();
            if(isIndonesianText(text)) {
                const key = generateKey(prefix, text);
                extracted.push({ node: jsxText, key, text: text.trim(), type: 'JsxText' });
            }
        }

        const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
        for (const attr of jsxAttributes) {
            const nameNode = attr.getNameNode();
            if(!nameNode) continue;
            const name = nameNode.getText();
            if(['placeholder', 'title', 'label'].includes(name)) {
                const init = attr.getInitializer();
                if(init && init.getKind() === SyntaxKind.StringLiteral) {
                    const text = init.getLiteralText();
                    if(isIndonesianText(text)) {
                        const key = generateKey(prefix, text);
                        extracted.push({ node: attr, key, text: text.trim(), type: 'StringLiteral', attrName: name });
                    }
                }
            }
        }

        if(extracted.length > 0) {
            // Add import if missing
            const imports = sourceFile.getImportDeclarations();
            let hasCmsImport = false;
            for(const imp of imports) {
                if(imp.getModuleSpecifierValue().includes("CmsProvider")) {
                    hasCmsImport = true;
                    break;
                }
            }
            if(!hasCmsImport) {
                sourceFile.addImportDeclaration({
                    namedImports: ["useCms"],
                    moduleSpecifier: "@/components/layout/CmsProvider"
                });
            }

            let mainFunc = sourceFile.getDefaultExportSymbol()?.getValueDeclaration();
            if(!mainFunc) {
               const funcs = sourceFile.getFunctions();
               if(funcs.length > 0) mainFunc = funcs[0];
            }

            if(mainFunc) {
                let body = null;
                if (mainFunc.getKind() === SyntaxKind.FunctionDeclaration) {
                    body = mainFunc.getBody();
                } else if (mainFunc.getKind() === SyntaxKind.VariableDeclaration) {
                    const init = mainFunc.getInitializer();
                    if(init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
                        body = init.getBody();
                    }
                }
                
                if(body && body.getKind() === SyntaxKind.Block) {
                    if(!body.getText().includes("useCms()")) {
                        body.insertStatements(0, "const { t } = useCms();");
                    }
                }
            }

            extracted.sort((a, b) => b.node.getPos() - a.node.getPos());
            for(const ext of extracted) {
                if(ext.type === 'JsxText') {
                    try {
                        const newText = `{t('${ext.key}', \`${ext.text.replace(/`/g, '\\`')}\`)}`;
                        ext.node.replaceWithText(newText);
                        allKeys.push({ content_key: ext.key, content_value: ext.text, content_type: 'text' });
                    } catch(e) {}
                } else if(ext.type === 'StringLiteral') {
                    try {
                        const newAttr = `${ext.attrName}={t('${ext.key}', \`${ext.text.replace(/`/g, '\\`')}\`)}`;
                        ext.node.replaceWithText(newAttr);
                        allKeys.push({ content_key: ext.key, content_value: ext.text, content_type: 'text' });
                    } catch(e) {}
                }
            }
            modified = true;
        }

        if(modified) {
            sourceFile.saveSync();
            totalMigrated++;
            console.log(`Migrated remaining: ${sourceFile.getFilePath()}`);
        }
    }

    if(allKeys.length > 0) {
        fs.writeFileSync('cms-seed-remaining.json', JSON.stringify(allKeys, null, 2));
        console.log(`\nGenerated ${allKeys.length} new CMS keys across ${totalMigrated} files.`);
        
        const chunkSize = 100;
        for (let i = 0; i < allKeys.length; i += chunkSize) {
            const chunk = allKeys.slice(i, i + chunkSize);
            const { error } = await supabase.from('site_content').upsert(chunk, { onConflict: 'content_key' });
            if(error) console.error("Supabase Error on chunk:", error);
        }
        console.log("Successfully seeded texts to Database!");
    } else {
        console.log("No new texts found.");
    }
}

run().catch(console.error);
