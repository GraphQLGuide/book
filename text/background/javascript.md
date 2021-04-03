---
title: JavaScript
---

# JavaScript

Most of the code in the book is in modern JavaScript. If you’re new to JS, you can learn through interactive [courses](https://www.codecademy.com/learn/introduction-to-javascript), video ([intro](https://www.leveluptutorials.com/tutorials/javascript-tutorials?ref=guide) and [intermediate](https://javascript30.com/?ref=guide)), or [a combination](https://www.khanacademy.org/computing/computer-programming/programming).

If you know traditional JS, but some of the new syntax is unfamiliar (for instance [async/await]((https://codeburst.io/javascript-es-2017-learn-async-await-by-example-48acc58bad65)), here’s a [course on ES6](https://es6.io/?ref=guide).

The one JS topic we’ll cover here is classes:

## Classes

A **class** is a template for an object. With this class:

```js
class Animal {
  constructor(name) {
    this.name = name
  }

  speak() {
    console.log(`${this.name} makes a noise.`)
  }
}
```

We can make an object, or **instance** of the class:

```js
const loren = new Animal('Loren')
```

`loren` is now an instance of `Animal`. When JavaScript evaluated `new Animal('Loren')`, it created a new object and called the `constructor` method with the string `'Loren'`, which set the object’s property `name` to `'Loren'` and (implicitly) returned the new object. Now when we do:

```js
console.log(loren.name)
loren.speak()
```

We see the output:

```
Loren
Loren makes a noise.
```

The class `Animal` is a template that we can create multiple different instances of:

```js
const loren = new Animal('Loren')
const graphy = new Animal('Graphy')

loren.speak()
graphy.speak()
```

Results in:

```
Loren makes a noise.
Graphy makes a noise.
```

Both of the instances have the `.speak()` method, but they have different values for the `.name` property, so `.speak()` logs different strings.

We can also create **subclasses** by using the syntax `class SubClass extends SuperClass`:

```js
class Animal {
  constructor(name) {
    this.name = name
    console.log(`${this.name} is a ${this.constructor.name}.`)
  }

  speak() {
    console.log(`${this.name} makes a noise.`)
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name)
    console.log('Subspecies: Canis lupus familiaris.')
  }
}
```

`Dog` is a subclass of `Animal`. `this.constructor.name` is the name of the class (`'Dog'` if `new Dog()` or `'Animal'` if `new Animal()`). In its constructor, it calls the superclass’s constructor (`super(name)`) and then logs. So now if we do:

```js
const graphy = new Dog()
console.log(graphy.name)
graphy.speak()
```

We see:

```
Graphy is a Dog.
Subspecies: Canis lupus familiaris.
Graphy
Graphy makes a noise.
```

A subclass can override a superclass’s method or define new methods:

```js
class Dog extends Animal {
  constructor(name) {
    super(name)
  }

  speak() {
    console.log(`${this.name} barks.`)
  }
}

const loren = new Animal('Loren')
loren.speak()

const graphy = new Dog('Graphy')
graphy.speak()
graphy.sit()
```

```
Loren is a Animal.
Loren makes a noise.
Graphy is a Dog.
Subspecies: Canis lupus familiaris.
Graphy barks.
Graphy sits.
```

If we tried to do `loren.sit()`, we would get an error because `Animal` doesn’t have a `.sit()` method:

```
loren.sit()
      ^

TypeError: loren.sit is not a function
```

We can have multiple subclasses, for instance `Rabbit` and `Cat`, and subclasses can have subclasses, for instance `class Lynx extends Cat`.