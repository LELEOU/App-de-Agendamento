# Política de Segurança

## 🔒 Versões Suportadas

Apenas a versão mais recente do sistema recebe atualizações de segurança:

| Versão | Suportada          |
| ------ | ------------------ |
| 1.0.x  | ✅ Sim             |
| < 1.0  | ❌ Não             |

## 🚨 Reportando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, **NÃO** abra uma issue pública. Em vez disso:

### 📧 Contato Seguro
- **Email:** leonardodevasconcelos3@gmail.com
- **GitHub:** [@LELEOU](https://github.com/LELEOU)
- **Assunto:** [SECURITY] Vulnerabilidade no Sistema de Agendamento

### 📝 Informações Necessárias
Por favor, inclua o máximo de informações possível:

- Descrição detalhada da vulnerabilidade
- Passos para reproduzir o problema
- Impacto potencial
- Versão afetada
- Ambiente (browser, OS, etc.)

### ⏱️ Tempo de Resposta
- **Confirmação:** Dentro de 48 horas
- **Análise inicial:** Dentro de 7 dias
- **Correção:** Depende da gravidade (crítico: 24-48h, alto: 7 dias, médio: 30 dias)

## 🛡️ Medidas de Segurança Implementadas

### **Autenticação & Autorização**
- ✅ JWT tokens com expiração automática
- ✅ Row Level Security (RLS) no PostgreSQL
- ✅ Validação de permissões por função
- ✅ Sanitização de inputs

### **Proteção de Dados**
- ✅ HTTPS obrigatório em produção
- ✅ Variáveis de ambiente para credenciais
- ✅ Headers de segurança (CSP, HSTS)
- ✅ Validação client-side e server-side

### **Infraestrutura**
- ✅ Supabase com certificações SOC 2 Type II
- ✅ Backup automático criptografado
- ✅ Logs de auditoria
- ✅ Rate limiting nas APIs

## 🏆 Programa de Recompensas

Reconhecemos pesquisadores de segurança que nos ajudam a manter o sistema seguro:

- **Crítico:** Reconhecimento público
- **Alto:** Reconhecimento público 
- **Médio:** Reconhecimento público 
- **Baixo:** Reconhecimento público


## ⚠️ Vulnerabilidades Conhecidas

Atualmente não há vulnerabilidades conhecidas. Este documento será atualizado conforme necessário.

## 📚 Recursos de Segurança

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Web Security Guidelines](https://web.dev/secure/)

---

*Última atualização: Dezembro 2024*
