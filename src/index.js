const express = require("express");
const { v4 } = require("uuid");

const app = express();

app.use(express.json());

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    response.status(400).json({ error: "Customer not found!" });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  return statement.reduce((acc, val) => {
    if (val.type === "credit") {
      return acc + val.amount;
    }

    return acc - val.amount;
  }, 0);
}

const customers = [
  {
    id: v4(),
    name: "Mateus",
    cpf: "15266724722",
    statement: [],
  },
];

app.post("/account", (request, response) => {
  const { name, cpf } = request.body;

  const checkIfCustomerExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (checkIfCustomerExists) {
    return response.status(400).json({ error: "Customer already exists" });
  }

  const account = {
    id: v4(),
    name,
    cpf,
    statement: [],
  };

  customers.push(account);

  response.json(account);
});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const { description, amount } = request.body;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(Date.now()),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const { amount } = request.body;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(Date.now()),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;

  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(204).send();
});

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);
