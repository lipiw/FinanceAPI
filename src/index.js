const express = require('express');
const {v4: uuid} = require('uuid');

const app = express();
app.use(express.json());

const customers=[];

//Middleware
function verifyIfExistsAccountCPF(req, res, next){
    const {cpf} = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer){
        return res.status(400).json({error: "Customer not found."})
    }

    req.customer= customer;

    return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, statement) =>{       // acc (Acumulador), operation (Objeto que esta dentro do statement)
        if(statement.type === "credit"){ 
            return acc + statement.amount;
        }else{
            return acc - statement.amount;
        }
    }, 0);                                      //Iniciando a variavel acc
    
    return balance;
}

app.post('/account', (req, res) =>{
    const {cpf, name} = req.body;

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);       //Percorre o vetor e retorna um boolean

    if(customerAlreadyExists){
        return res.status(400).json('Custumer already exists.')
    }

    customers.push({
        cpf,
        name,
        id: uuid(),
        statement: []
    });

    return res.status(201).send();
});

app.get('/statement', verifyIfExistsAccountCPF, (req, res) =>{
    const {customer} = req;
    return res.json(customer.statement);
})


app.post('/deposit', verifyIfExistsAccountCPF, (req, res) =>{
    const {customer} = req;
    const {description, amount} = req.body;
    
    const statementOperation = {
        description,
        amount,
        date_at: new Date(),
        type:'credit'
    }

    customer.statement.push(statementOperation);
    return res.send(201).send();
});

app.post('/withdraw', verifyIfExistsAccountCPF, (req, res) =>{
    const {customer} = req;
    const {amount} = req.body;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return res.status(400).json({error: 'Insufficient funds!'})
    }

    const statementOperation = {
        amount,
        date_at: new Date(),
        type:'debit'
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
})

app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) =>{
    const {customer} = req;
    const {date} = req.query;

    const dateFormat = new Date(date + " 00:00");        //Para pegar a data independente do horario

    const statement = customer.statement.filter((statement) =>
        statement.create_at.toDateString() === new Date(dateFormat).toDateString());    //toDateString() para pegar a data no formato que queremos. (2020-02-07)

    return res.json(statement);
})

app.listen(3333);