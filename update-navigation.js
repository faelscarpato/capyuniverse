#!/usr/bin/env node

/**
 * Script para atualizar todas as páginas HTML do CapyUniverse
 * com o sistema de navegação modal universal
 */

const fs = require('fs');
const path = require('path');

// Configurações
const PROJECT_DIR = __dirname;
const NAVIGATION_SCRIPT = '<script src="cu-navigation.js" defer></script>';
const EXCLUDE_FILES = [
  'index.html', // Já atualizado manualmente
  'capy-hub.html', // Já atualizado manualmente
  'capyimg.html', // Já atualizado manualmente
  'service-worker.js',
  'manifest.webmanifest',
  'tools.json'
];

/**
 * Verifica se um arquivo HTML já tem o script de navegação
 */
function hasNavigationScript(content) {
  return content.includes('cu-navigation.js');
}

/**
 * Adiciona o script de navegação ao HTML
 */
function addNavigationScript(content) {
  // Procura por outros scripts do CapyUniverse para inserir junto
  const cuAppPattern = /<script src="cu-app\.js"[^>]*><\/script>/;
  const cuInitPattern = /<script src="cu-init\.js"[^>]*><\/script>/;
  
  if (cuAppPattern.test(content)) {
    // Adiciona após cu-app.js
    return content.replace(cuAppPattern, match => `${match}\n  ${NAVIGATION_SCRIPT}`);
  } else if (cuInitPattern.test(content)) {
    // Adiciona após cu-init.js
    return content.replace(cuInitPattern, match => `${match}\n  ${NAVIGATION_SCRIPT}`);
  } else {
    // Adiciona antes do </head>
    return content.replace('</head>', `  ${NAVIGATION_SCRIPT}\n</head>`);
  }
}

/**
 * Processa um arquivo HTML
 */
function processHtmlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verifica se já tem o script
    if (hasNavigationScript(content)) {
      console.log(`✓ ${path.basename(filePath)} - já possui navegação universal`);
      return false;
    }
    
    // Adiciona o script
    const updatedContent = addNavigationScript(content);
    
    // Salva o arquivo
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ ${path.basename(filePath)} - navegação universal adicionada`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

/**
 * Encontra todos os arquivos HTML no diretório
 */
function findHtmlFiles(dir) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Pula diretórios específicos
        if (['node_modules', '.git', 'tools', 'icons', 'img'].includes(entry.name)) {
          continue;
        }
        // Recursão em subdiretórios
        files.push(...findHtmlFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        // Pula arquivos excluídos
        if (!EXCLUDE_FILES.includes(entry.name)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando atualização do sistema de navegação universal...\n');
  
  // Verifica se o arquivo de navegação existe
  const navigationPath = path.join(PROJECT_DIR, 'cu-navigation.js');
  if (!fs.existsSync(navigationPath)) {
    console.error('❌ Arquivo cu-navigation.js não encontrado!');
    console.error('   Certifique-se de que o arquivo está no diretório raiz do projeto.');
    process.exit(1);
  }
  
  // Encontra todos os arquivos HTML
  const htmlFiles = findHtmlFiles(PROJECT_DIR);
  console.log(`📁 Encontrados ${htmlFiles.length} arquivos HTML para processar\n`);
  
  if (htmlFiles.length === 0) {
    console.log('ℹ️  Nenhum arquivo HTML encontrado para atualizar.');
    return;
  }
  
  // Processa cada arquivo
  let updated = 0;
  let skipped = 0;
  
  for (const filePath of htmlFiles) {
    if (processHtmlFile(filePath)) {
      updated++;
    } else {
      skipped++;
    }
  }
  
  // Relatório final
  console.log(`\n📊 Relatório final:`);
  console.log(`   ✅ Arquivos atualizados: ${updated}`);
  console.log(`   ✓  Arquivos já atualizados: ${skipped}`);
  console.log(`   📁 Total processado: ${htmlFiles.length}`);
  
  if (updated > 0) {
    console.log(`\n🎉 Sistema de navegação universal adicionado com sucesso!`);
    console.log(`   Agora todas as páginas terão navegação modal fluida.`);
  } else {
    console.log(`\n✨ Todas as páginas já estão atualizadas!`);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  processHtmlFile,
  findHtmlFiles,
  hasNavigationScript,
  addNavigationScript
};