# Project Overview

This document outlines the architecture and functionality of the `procbase` project. The project aims to provide a robust system for managing and utilizing "procedure bases" through a server and a command-line interface.

## Core Concepts

### Procedure Base

A **procedure base** is a file-based repository for a collection of TypeScript code, organized into distinct categories of symbols. It serves as a structured storage for reusable code components.

### Symbols

The code within a procedure base is categorized into three types of symbols:

*   **Types**: These are pure compile-time TypeScript type definitions (e.g., `type`, `interface`). They do not generate any executable JavaScript code when compiled. Their purpose is to define data structures and contracts.

*   **Instances**: These are concrete implementations of logic. An instance can be a variable, a function, or a class. Every instance must be bound to a specific **Type**.

*   **Behaviors**: A behavior is a test suite designed to verify the functionality of an **Instance**. It consists of test files and any associated test assets. An **Instance** can be optionally bound to one or more behaviors.

## Components

The project consists of two main components:

1.  **MCP Server**: A server application that manages the procedure bases.
2.  **`procbase` CLI**: A command-line tool for developers to interact with the MCP server and manage procedure bases.

## Features

### MCP Server

The MCP server exposes an API for the following operations:

1.  **Symbol Management**:
    *   Add a new Type, Instance, or Behavior to a procedure base.
    *   Delete a Behavior. Note: Types and Instances cannot be deleted to prevent cascading breaks in dependencies.

2.  **Search**:
    *   Perform literal (keyword-based) searches for Types, Instances, and Behaviors.
    *   Perform semantic (meaning-based) searches for Types, Instances, and Behaviors.

3.  **Updates & Bindings**:
    *   Bind an Instance to a new Behavior, effectively adding more test cases.
    *   Unbind an Instance from a Behavior.
    *   Update an existing Behavior. The update is only accepted if it passes all existing behavior bindings.
    *   Update an existing Instance. The update must satisfy its existing Type and Behavior bindings.

### `procbase` CLI

The `procbase` command-line interface provides developers with tools to manage procedure bases and control the server:

1.  **Procedure Base Management**:
    *   `create`: Create a new procedure base.
    *   `delete`: Delete an existing procedure base.
    *   `list`: List all available procedure bases.
    *   `use`: Switch the current context to a specific procedure base.

2.  **Server Control**:
    *   `start`: Start the MCP server.
    *   `stop`: Stop the MCP server.
    *   `restart`: Restart the MCP server.

3.  **Server Interaction**:
    *   **Types Operations**
        *   `procbase type add <path-to-type-file>`: Adds a new type.
        *   `procbase type search <query>`: Searches for types. Use `--semantic` for semantic search.
    *   **Instances Operations**
        *   `procbase instance add <path-to-instance-file>`: Adds a new instance.
        *   `procbase instance search <query>`: Searches for instances. Use `--semantic` for semantic search.
        *   `procbase instance update <instance-name> with <path-to-instance-file>`: Updates an instance.
        *   `procbase instance bind <instance-name> to <behavior-name>`: Binds an instance to a behavior.
        *   `procbase instance unbind <instance-name> from <behavior-name>`: Unbinds an instance from a behavior.
    *   **Behaviors Operations**
        *   `procbase behavior add <path-to-behavior-directory>`: Adds a new behavior.
        *   `procbase behavior search <query>`: Searches for behaviors. Use `--semantic` for semantic search.
        *   `procbase behavior update <behavior-name> with <path-to-behavior-directory>`: Updates a behavior.
        *   `procbase behavior rm <behavior-name>`: Deletes a behavior.
