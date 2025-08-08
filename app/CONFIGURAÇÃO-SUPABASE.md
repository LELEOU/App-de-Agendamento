## 📋 **Passo a Passo para Configurar o Supabase**

### **1. Criar Conta no Supabase**
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Crie uma conta gratuita (GitHub recomendado)

### **2. Criar Novo Projeto**
1. Clique em "New Project"
2. Escolha um nome: `projeto` ou similar, so pra poder rodar
3. Crie uma senha forte para o banco (NAOOO PERCA ELA!!!!!!)
4. Escolha região: `South America (São Paulo)` para melhor performance
5. Clique em "Create new project"

### **3. Configurar o Banco de Dados**
1. No dashboard, vá em **SQL Editor**
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `database-setup.sql`
4. Cole no editor e clique em **"Run"**
5. ✅ Suas tabelas serão criadas automaticamente!

### **4. Obter as Credenciais**
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public key** (chave pública)

### **5. Configurar no Projeto**
1. Abra o arquivo: `src/js/supabase-config.js`
2. Substitua as credenciais:

```javascript
const SUPABASE_URL = 'https://seu-projeto-aqui.supabase.co'
const SUPABASE_ANON_KEY = 'sua-chave-publica-muitoooo-longa-aqui'
```

### **6. Configurar Autenticação**
1. No Supabase, vá em **Authentication** → **Settings**
2. Em **Site URL**, adicione: `http://localhost:5000` (Live Server é o meu caso http://localhost:5501)
3. Em **Redirect URLs**, adicione também: `http://localhost:3000` (servidor customizado)
4. ✅ Pronto para desenvolvimento!

### **7. Executar o projeto**

**Opção 1: Live Server (Recomendado para desenvolvimento)** (esse é o meu caso, mas so pq deu problema com o firebase)
1. Instale a extensão "Live Server" no VS Code
2. Abra o arquivo `src/index.html` 
3. Clique com botão direito → "Open with Live Server"
4. ✅ Acesse: `http://localhost:5501` ou `http://127.0.0.1:5501`

**Opção 2: Servidor customizado (para produção)**
1. No terminal, rode:
```bash
npm run serve
```
2. ✅ Acesse: `http://localhost:3000`

### **Se for criar a primeira conta, crie e mude na tabela da staff para admin, caso o contrario ficara como manicure!**