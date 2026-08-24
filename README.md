# Barbearia Vintage — Frontend

Interface web interna do case técnico da Insper Jr. Tech.

## Stack
- React
- Vite
- Lucide icons
- CSS responsivo

## Rodando

```bash
npm install
cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`.

O backend precisa estar rodando em `http://localhost:8000` ou ser configurado em:

```env
VITE_API_URL=http://localhost:8000
```

## Telas
- Login
- Dashboard
- Clientes
- Agenda
- Cadastro/edição de agendamento
- Atualização de status
- Financeiro (tabela de preços, faturamento, a receber, despesas e lucro por mês, com seletor de mês)

## Financeiro

Área protegida por uma chave de acesso extra, além do login (validada pelo backend em `POST /finance/unlock`). Chave padrão:

```
Confidencial2026
```

Troque em `FINANCE_PASSCODE` no `.env` do backend.

Despesas (produtos, funcionários, aluguel, impostos etc.) são cadastradas por lá e usadas junto com os agendamentos concluídos para calcular faturamento, despesas e lucro de cada mês.
