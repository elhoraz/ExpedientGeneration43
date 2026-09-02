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
    
    // Replace absolute positioning of the lock button container
    // Original: <div style={{ position: "absolute", top: 0, right: 0 }}>
    if (content.includes('position: "absolute", top: 0, right: 0')) {
        content = content.replace(/position: "absolute", top: 0, right: 0/g, 'display: "flex", marginLeft: "auto", zIndex: 10');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});
