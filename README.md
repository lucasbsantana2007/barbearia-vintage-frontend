# Barbearia Vintage — Frontend

Interface web interna da plataforma **Barbearia Vintage**, desenvolvida para o case técnico da **Insper Jr. Tech**. É a aplicação usada pela equipe da barbearia para gerenciar clientes, agenda e o financeiro do negócio.

## Stack
- React
- Vite
- Lucide Icons
- CSS

## Pré-requisitos

Este frontend **não funciona sozinho**: ele é apenas a interface e depende da API do backend para autenticação, dados e regras de negócio. Antes de rodar o frontend, o **backend precisa estar rodando**, por padrão em:

```
http://localhost:8000
```

Frontend e backend precisam permanecer **rodando ao mesmo tempo**, em **terminais separados**. Sem o backend ativo, telas como Login, Dashboard, Clientes, Agenda e Financeiro não conseguem carregar dados.

## Como executar

```bash
npm install
npm run dev
```

Por padrão, a aplicação fica disponível em:

```
http://localhost:5173
```

## Configuração

A variável de ambiente usada pelo frontend é:

```env
VITE_API_URL=http://localhost:8000
```

Ela define o **endereço base da API** do backend — é para ela que todas as requisições da aplicação (login, clientes, agenda, financeiro etc.) são enviadas.

⚠️ **Não** aponte `VITE_API_URL` para `/docs`. O caminho `/docs` é a documentação interativa (Swagger) do backend, usada apenas para explorar a API manualmente — não é o endereço que o frontend deve consumir.

## Integração com backend

O frontend não acessa banco de dados nem contém regras de negócio: ele apenas consome a API REST do backend através de `VITE_API_URL`.

```
Frontend
   ↓ requisição HTTP
Backend
   ↓
Banco de dados
```

O **backend** é responsável por autenticação, validações, regras de negócio (ex.: bloqueio de conflito de horário) e acesso aos dados. O frontend só exibe e envia informações.

## Telas
- Login
- Dashboard
- Clientes
- Agenda
- Cadastro/edição de agendamentos
- Atualização de status de agendamentos
- Financeiro

## Financeiro

Área com a visão financeira da barbearia, organizada por mês (é possível navegar entre o mês atual e meses anteriores para comparar desempenho). Mostra:

- Tabela de preços praticados por serviço
- Faturamento do mês (baseado nos agendamentos concluídos)
- Valor a receber (agendamentos ainda não concluídos)
- Despesas cadastradas (produtos, funcionários, aluguel, impostos etc.), com cadastro/edição/remoção
- Lucro do mês (faturamento − despesas)

Por conter informações sensíveis, essa área é protegida por uma **chave de acesso adicional**, além do login normal. A chave é validada pelo backend (rota `POST /finance/unlock`) e só libera o conteúdo da tela quando confirmada corretamente.

A credencial necessária **não está neste README** — ela é configurada via variável de ambiente no `.env` do backend e é fornecida separadamente junto com a entrega do case.

## Erros comuns

**"Failed to fetch"**
Normalmente significa que o frontend não conseguiu se comunicar com o backend. Verifique se:
- o backend está rodando;
- ele está disponível em `http://localhost:8000`;
- `VITE_API_URL` está configurado corretamente;
- frontend e backend estão rodando simultaneamente.

**`http://localhost:5173` não abre**
Verifique se o comando `npm run dev` ainda está em execução no terminal.

## Como testar o sistema completo

1. Inicie o backend.
2. Verifique `http://localhost:8000/docs`.
3. Mantenha o backend rodando.
4. Abra outro terminal.
5. Inicie o frontend com `npm run dev`.
6. Acesse `http://localhost:5173`.
7. Utilize as credenciais fornecidas separadamente junto à entrega.
8. Caso queira testar a automação, certifique-se também de que o workflow do n8n esteja configurado/ativo.
