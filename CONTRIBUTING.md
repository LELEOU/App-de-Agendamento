# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o Sistema de Agendamento para Salões! Este documento fornece diretrizes para contribuições.

## 📋 Índice

- [🚀 Como Começar](#-como-começar)
- [🔧 Configuração do Ambiente](#-configuração-do-ambiente)
- [📝 Tipos de Contribuição](#-tipos-de-contribuição)
- [🌿 Fluxo de Branches](#-fluxo-de-branches)
- [✅ Padrões de Código](#-padrões-de-código)
- [🧪 Testes](#-testes)
- [📤 Enviando Alterações](#-enviando-alterações)
- [🐛 Reportando Bugs](#-reportando-bugs)
- [💡 Sugerindo Funcionalidades](#-sugerindo-funcionalidades)

## 🚀 Como Começar

### 1. Fork do Repositório
```bash
# Clique em "Fork" no GitHub ou use o comando
gh repo fork LELEOU/App-de-Agendamento --clone
```

### 2. Clone e Configure
```bash
cd App-de-Agendamento
npm install
cp .env.example .env
# Configure suas credenciais no arquivo .env
```

### 3. Execute o Projeto
```bash
npm run dev
# Acesse http://localhost:5173
```

## 🔧 Configuração do Ambiente

### **Pré-requisitos**
- Node.js 18+
- npm 9+
- Conta no Supabase
- Git configurado

### **Ferramentas Recomendadas**
- VS Code com extensões:
  - ES6 String HTML
  - Prettier
  - ESLint
  - Tailwind CSS IntelliSense

### **Configuração do Supabase**
1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute `src/database-setup.sql` no SQL Editor
3. Configure suas credenciais no `.env`

## 📝 Tipos de Contribuição

### 🐛 **Correção de Bugs**
- Correções de funcionalidades quebradas
- Melhorias de performance
- Correções de segurança

### ✨ **Novas Funcionalidades**
- Implementação de novas features
- Melhorias na UX/UI
- Integrações com APIs externas

### 📚 **Documentação**
- Melhorias no README
- Comentários no código
- Exemplos de uso
- Traduções

### 🎨 **Design e UI**
- Melhorias visuais
- Responsividade
- Acessibilidade
- Temas e cores

## 🌿 Fluxo de Branches

### **Estrutura de Branches**
```
main              # Produção estável
├── develop       # Desenvolvimento
├── feature/*     # Novas funcionalidades
├── bugfix/*      # Correções de bugs
├── hotfix/*      # Correções urgentes
└── release/*     # Preparação para release
```

### **Nomenclatura**
```bash
# Funcionalidades
feature/add-whatsapp-integration
feature/improve-dashboard-ui

# Correções
bugfix/fix-appointment-validation
bugfix/resolve-notification-error

# Hotfixes
hotfix/security-patch-auth
hotfix/critical-database-issue
```

### **Comandos Git**
```bash
# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Manter atualizado
git fetch origin
git rebase origin/develop

# Push da branch
git push origin feature/nova-funcionalidade
```

## ✅ Padrões de Código

### **JavaScript**
```javascript
// ✅ Bom
const getUserAppointments = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        throw error;
    }
};

// ❌ Evitar
function get_user_appointments(user_id) {
    // sem tratamento de erro
    return supabase.from('appointments').select('*').eq('user_id', user_id);
}
```

### **HTML**
```html
<!-- ✅ Bom -->
<button 
    class="btn-primary"
    aria-label="Confirmar agendamento"
    onclick="confirmAppointment()"
>
    Confirmar
</button>

<!-- ❌ Evitar -->
<button onclick="confirm()">OK</button>
```

### **CSS/Tailwind**
```html
<!-- ✅ Bom -->
<div class="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">

<!-- ❌ Evitar -->
<div class="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md text-black border-solid border-2">
```

## 🧪 Testes

### **Testando Funcionalidades**
```bash
# Teste manual básico
npm run dev

# Teste de build
npm run build
npm run preview

# Teste em diferentes browsers
# Chrome, Firefox, Safari, Edge
```

### **Checklist de Testes**
- [ ] Funciona em desktop e mobile
- [ ] Funciona offline (PWA)
- [ ] Notificações funcionam
- [ ] Permissões por função respeitadas
- [ ] Performance adequada
- [ ] Acessibilidade básica

## 📤 Enviando Alterações

### **1. Commit Guidelines**
Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
tipo(escopo): descrição

# Exemplos
feat(auth): adicionar login com Google
fix(calendar): corrigir bug na navegação de meses
docs(readme): atualizar instruções de instalação
style(ui): melhorar responsividade do dashboard
refactor(api): otimizar queries do Supabase
test(e2e): adicionar testes de agendamento
```

### **2. Pull Request**
```markdown
## 📝 Descrição
Breve descrição das mudanças

## 🎯 Tipo de Mudança
- [ ] 🐛 Correção de bug
- [ ] ✨ Nova funcionalidade
- [ ] 📚 Atualização de documentação
- [ ] 🎨 Mudanças de estilo/UI
- [ ] ♻️ Refatoração

## 🧪 Como Testar
1. Execute `npm run dev`
2. Navegue para X
3. Faça Y
4. Verifique que Z acontece

## 📸 Screenshots (se aplicável)
Cole imagens das mudanças visuais

## ✅ Checklist
- [ ] Código testado localmente
- [ ] Documentação atualizada
- [ ] Segue padrões do projeto
- [ ] Commit messages seguem convenção
```

## 🐛 Reportando Bugs

### **Template de Issue**
```markdown
**🐛 Descrição do Bug**
Descrição clara e concisa do problema

**🔄 Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**✅ Comportamento Esperado**
O que deveria acontecer

**📸 Screenshots**
Se aplicável, adicione screenshots

**💻 Ambiente:**
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 91]
- Versão: [ex: 1.0.0]

**📋 Contexto Adicional**
Qualquer outra informação sobre o problema
```

## 💡 Sugerindo Funcionalidades

### **Template de Feature Request**
```markdown
**✨ Funcionalidade Solicitada**
Descrição clara da funcionalidade

**🎯 Problema que Resolve**
Qual problema esta funcionalidade resolve?

**💡 Solução Proposta**
Descrição da solução que você gostaria

**🔄 Alternativas Consideradas**
Outras soluções que você considerou

**📋 Contexto Adicional**
Screenshots, mockups, referências
```

## 🏆 Reconhecimento

Contribuidores são listados no README e recebem:
- 🌟 Badge de contribuidor
- 📝 Menção no changelog
- 🎉 Reconhecimento na comunidade

## 📞 Suporte

- **GitHub Issues:** [App-de-Agendamento/issues](https://github.com/LELEOU/App-de-Agendamento/issues)
- **Email:** leonardodevasconcelos3@gmail.com
- **Desenvolvedor:** [@LELEOU](https://github.com/LELEOU)

---

## 🤝 Código de Conduta

### **Nosso Compromisso**
Manter um ambiente acolhedor e inclusivo para todos.

### **Padrões**
- ✅ Linguagem respeitosa e inclusiva
- ✅ Foco na colaboração
- ✅ Aceitar críticas construtivas
- ❌ Assédio ou discriminação
- ❌ Linguagem ofensiva
- ❌ Ataques pessoais

### **Aplicação**
Violações podem ser reportadas para leonardodevasconcelos3@gmail.com

---

**Obrigado por contribuir! 🚀**
