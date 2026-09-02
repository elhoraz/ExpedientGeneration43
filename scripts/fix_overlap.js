const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src', 'app', '(dashboard)', 'admin'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Revert the lock button wrapper to absolute positioning
    if (content.includes('marginLeft: "auto", display: "flex", alignItems: "center"')) {
        content = content.replace(/marginLeft: "auto", display: "flex", alignItems: "center"/g, 'position: "absolute", top: 0, right: 0, zIndex: 10');
        changed = true;
    }
    if (content.includes('display: "flex", marginLeft: "auto", zIndex: 10')) {
        content = content.replace(/display: "flex", marginLeft: "auto", zIndex: 10/g, 'position: "absolute", top: 0, right: 0, zIndex: 10');
        changed = true;
    }

    // 2. Add paddingRight to admin-header so it doesn't overlap
    // Matches: className="admin-header" style={{ ... }}
    const headerRegex = /className="admin-header"\s*style={{([^}]+)}}/g;
    content = content.replace(headerRegex, (match, p1) => {
        if (!p1.includes('paddingRight')) {
            changed = true;
            return `className="admin-header" style={{${p1}, paddingRight: "160px"}}`;
        }
        return match;
    });

    // Handle case where there is no style prop
    const headerNoStyleRegex = /className="admin-header"(?!\s*style)/g;
    content = content.replace(headerNoStyleRegex, (match) => {
        changed = true;
        return `className="admin-header" style={{ position: "relative", paddingRight: "160px" }}`;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed layout in: ${file}`);
    }
});
