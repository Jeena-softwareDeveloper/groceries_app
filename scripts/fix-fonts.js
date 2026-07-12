const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const processFile = (file) => {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace font weights
  const newContent = content.replace(/fontWeight:\s*['"]([1-9]00|bold|normal)['"]/g, (match, weight) => {
    changed = true;
    if (weight === 'normal' || weight === '400') return 'fontFamily: fonts.regular';
    if (weight === '500' || weight === '600') return 'fontFamily: fonts.medium';
    if (weight === '700' || weight === '800' || weight === '900' || weight === 'bold') return 'fontFamily: fonts.bold';
    return match;
  });

  if (changed) {
    let finalContent = newContent;
    const themeImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/constants\/theme['"]/;
    
    if (themeImportRegex.test(finalContent)) {
      finalContent = finalContent.replace(themeImportRegex, (match, imports) => {
        if (!imports.includes('fonts')) {
          return match.replace(imports, imports + ', fonts');
        }
        return match;
      });
    } else {
      finalContent = `import { fonts } from '@/constants/theme';\n` + finalContent;
    }

    fs.writeFileSync(file, finalContent);
    console.log(`Updated ${file}`);
  }
};

const dirs = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components')
];

dirs.forEach(d => {
  walk(d, (err, files) => {
    if (err) throw err;
    files.forEach(processFile);
  });
});
