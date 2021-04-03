---
title: Interfaces
---

# Interfaces

[Interfaces](http://graphql.org/learn/schema/#interfaces) define a list of fields that must be included in any object types implementing them. For instance, here are two interfaces, `BankAccount` and `InsuredAccount`, and and an object type that implements them, `CheckingAccount`:

```gql
interface BankAccount {
  accountNumber: String!
}

interface InsuredAccount {
  insuranceName: String
  insuranceAmount: Int!
}

type CheckingAccount implements BankAccount & InsuredAccount {
  accountNumber: String!
  insuranceName: String
  insuranceAmount: Int!
  routingNumber: String!
}
```

Since `CheckingAccount` implements both interfaces, it must include the fields from both. It can also include additional fields, like `routingNumber`.

Interfaces can implement other interfaces, like this:

```gql
interface InvestmentAccount implements BankAccount {
  accountNumber: String!
  marginApproved: Boolean!
}

type RetirementAccount implements InvestmentAccount {
  accountNumber: String!
  marginApproved: Boolean!
  contributionLimit: Int!
}
```

Interfaces are helpful for clarity and consistency in the schema, but they’re also useful as field types:

```gql
type Query {
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!
  accounts: [BankAccount]
}
```

We can now query for fields in `BankAccount`

```gql
query {
  user(id: "abc") {
    name 
    accounts {
      accountNumber: String!      
    }
  }
}
```

And if we want to query fields outside `BankAccount`, we can use a fragment:

```gql
query {
  user(id: "abc") {
    name 
    accounts {
      accountNumber: String!
      ... on RetirementAccount {
        marginApproved
        contributionLimit
      }
    }
  }
}
```

