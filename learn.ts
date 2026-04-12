// This file is for learning TypeScript syntax and features. It is not part of the actual project code.
// TypeScript is a statically typed superset of JavaScript that adds optional types, classes, interfaces, and other features to JavaScript. 
// It is designed to help developers write more maintainable and scalable code by providing type safety and better tooling support.

{/*1. Basic Types*/}
let name: string = "Alice" // explicitly typed variable
let name = "Alice" // implicitly typed variable, TypeScript infers the type as string
const age: number = 30

let fruits: string[] = ["apple", "banana", "orange"] // Array
let numbers: number[] = [1, 2, 3, 4, 5] 

let person: [string, number] = ["Alice", 30] // tuple type

{/*2. Interfaces*/}
{/*interface is used to define a contract for an object. 
   It can be used to define the shape of an object, including its properties and their types.
   it can be extended to create new interfaces, 
   and it can be implemented by classes to ensure they adhere to the defined structure. */}

interface User {
  name: string;
  age: number;
  email?: string; // ? means optional property
}
   
const anthony: User = {
  name: "Anthony",
  age: 25,
  email: "anthony@example.com"
};

{/*3. Union Types and Type Aliases*/}
{/* type is to define a type alias, which can be used to create a new name for a type. 
    It can be used to define complex types, such as union types, intersection types, and mapped types. 
    It can also be used to define simple types, such as string, number, and boolean.
    Union type allows a variable to hold values of multiple types.*/}

let id: string | number = "12345"; // id can be a string or a number
id = 12345; // valid assignment

function printId(id: string | number): void {
    if (typeof id === "string") {
        console.log(`ID as a string: ${id.toUpperCase()}`);
    } else {
        console.log(`ID as a number: ${id}`);
    }
}

type UserProfile = {
  name: string;
  age: number;
} 

type ID = string | number; // type alias for a union type

let userId: ID = "abc123"; // userId can be a string or a number

type AdminUser = User & { // intersection type combines properties of User and AdminUser
  isAdmin: boolean;
}

const profile: UserProfile = {
  name: "Bob",
  age: 28
};

{/*4. Functions and Generics*/}

function greet(user: User): string {
  return `Hello, ${user.name}! You are ${user.age} years old.`;
}

function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}
// ?? is the nullish coalescing operator, which returns the right-hand side operand when the left-hand side operand is null or undefined, and otherwise returns the left-hand side operand.

let multiply = (a: number, b: number): number => a*b; // arrow function with type annotations

// Generics allow you to create reusable components that can work with any data type.
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

firstElement([1, 2, 3]); // returns 1
firstElement(["a", "b", "c"]); // returns "a"

{/*5. React Component with Props using TypeScript*/}
import React, { use } from "react";
interface ButtonProps {
  label: string;
  onClick: () => void;
}
const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
}
//  React.FC is a type that represents a functional component in React. 
// It takes a generic type parameter that represents the props of the component. 
// In this case, ButtonProps is the type of the props for the Button component. 
// The component can then use these props to render the button with the appropriate label and onClick handler.

{/*6. Enum Types*/ }
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

// but prefer using union types over enums in TypeScript for better type safety and flexibility.
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

{/*7. Type Assertions*/}
let someValue: unknown = "This is a string";
let strLength: number = (someValue as string).length; // type assertion using 'as' syntax
// Type assertions are a way to tell the TypeScript compiler about the type of a variable when it cannot infer it on its own.
// They do not perform any runtime checks or type conversions, and they should be used with caution to avoid potential type errors.

{/*8. Type Guards*/}
function isString(value: unknown): value is string {
  return typeof value === "string";
}
function printValue(value: unknown): void {
  if (isString(value)) {
    console.log(`Value is a string: ${value.toUpperCase()}`);
  } else {
    console.log("Value is not a string");
  }
}
// Type guards are functions that allow you to narrow down the type of a variable within a conditional block.
// They return a boolean value and use the 'is' keyword to specify the type they are checking for. 
// In this example, the isString function checks if the value is of type string, and if it is, it allows us to safely call string methods on it within the printValue function.

{/*9. Utility Types*/}
interface Profile {
  name: string;
  age: number;
  email: string;
}
type ReadonlyProfile = Readonly<Profile> // makes all properties of Profile read-only
type PartialProfile = Partial<Profile> // makes all properties of Profile optional
type PickedProfile = Pick<Profile, "name" | "email"> // creates a new type with only the specified properties from Profile
type OmittedProfile = Omit<Profile, "age"> // creates a new type with all properties from Profile except the specified ones

type Partial<T> = {
  [P in keyof T]?: T[P];
}
// The Partial type is a utility type that takes a type T and makes all of its properties optional. 
// It uses mapped types to iterate over the keys of T and adds the optional modifier (?) to each property. 
// This can be useful when you want to create a new type that is based on an existing type but with some properties being optional.

// [Pin keyof T] is a mapped type that iterates over the keys of the type T.
// T[P] is an indexed access type that retrieves the type of the property P from the type T.
// ? makes the property optional, meaning it can be undefined or not present in the object.

{/*JavaScript hooks*/}
//  A hook is just a function that lets you use React features inside a component.
// give your component memory and abilities.

function useCounter(initialValue: number = 0): [number, () => void] {
  const [count, setCount] = React.useState(initialValue);
  const increment = () => setCount(count + 1);
  return [count, increment];
}

function Counter() {
  const [count, increment] = useCounter(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

import { useState, useEffect } from "react";
function useProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then(response => response.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });
    }, [userId]);   
    return { profile, loading };
}

// In a component
function UserProfile({ userId }: { userId: string }) {
  const { profile, loading } = useProfile(userId);
    if (loading) {
    return <p>Loading...</p>;
  }
    if (!profile) {
    return <p>Profile not found.</p>;
    }
    return <p>Name: {profile.name}, Age: {profile.age}</p>;
}