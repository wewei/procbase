#!/usr/bin/env bun
import { Command } from 'commander';
import { createProcbase } from './create';
import { deleteProcbase } from './delete';
import { listProcbases } from './list';
import { useProcbase } from './use';
import { showServerStatus } from './status';
import { startServer } from './server/start';
import { stopServer } from './server/stop';
import { restartServer } from './server/restart';
import { analyzeFileCommand } from './analysis';

const program = new Command();

program
  .name('procbase')
  .description('A CLI tool to manage procedure bases')
  .version('0.0.1');

program
    .command('create')
    .description('Create a new procbase')
    .argument('<name>', 'Name of the procbase to create')
    .action((name) => {
        createProcbase(name);
    });

program
    .command('delete')
    .description('Delete a procbase')
    .argument('<name>', 'Name of the procbase to delete')
    .action((name) => {
        deleteProcbase(name);
    });

program
    .command('list')
    .description('List all procbases')
    .action(() => {
        listProcbases();
    });

program
    .command('use')
    .description('Use a procbase')
    .argument('<name>', 'Name of the procbase to use')
    .action((name) => {
        useProcbase(name);
    });

program
    .command('start')
    .description('Start the MCP server')
    .action(() => {
        startServer();
    });

program
    .command('stop')
    .description('Stop the MCP server')
    .action(() => {
        stopServer();
    });

program
    .command('restart')
    .description('Restart the MCP server')
    .action(() => {
        restartServer();
    });

program
    .command('status')
    .description('Show MCP server status')
    .action(() => {
        showServerStatus();
    });

program
    .command('analysis')
    .description('Analyze a TypeScript file and output top-level symbols')
    .argument('<file>', 'Path to the TypeScript file to analyze')
    .action((file) => {
        analyzeFileCommand(file);
    });

const typeCommand = program.command('type').description('Manage types');

typeCommand
    .command('add')
    .description('Adds a new type')
    .argument('<path>', 'Path to the type file')
    .action((path) => {
        // TODO: Implement adding a type
        console.log(`Adding type from ${path}`);
    });

typeCommand
    .command('search')
    .description('Searches for types')
    .argument('<query>', 'Search query')
    .option('--semantic', 'Perform a semantic search')
    .action((query, options) => {
        // TODO: Implement searching for types
        console.log(`Searching for type: ${query}`, options.semantic ? 'with semantic search' : '');
    });

const instanceCommand = program.command('instance').description('Manage instances');

instanceCommand
    .command('add')
    .description('Adds a new instance')
    .argument('<path>', 'Path to the instance file')
    .action((path) => {
        // TODO: Implement adding an instance
        console.log(`Adding instance from ${path}`);
    });

instanceCommand
    .command('search')
    .description('Searches for instances')
    .argument('<query>', 'Search query')
    .option('--semantic', 'Perform a semantic search')
    .action((query, options) => {
        // TODO: Implement searching for instances
        console.log(`Searching for instance: ${query}`, options.semantic ? 'with semantic search' : '');
    });

instanceCommand
    .command('update')
    .description('Updates an instance')
    .argument('<name>', 'Name of the instance to update')
    .argument('<path>', 'Path to the new instance file')
    .action((name, path) => {
        // TODO: Implement updating an instance
        console.log(`Updating instance ${name} with ${path}`);
    });

instanceCommand
    .command('bind')
    .description('Binds an instance to a behavior')
    .argument('<instance-name>', 'Name of the instance')
    .argument('<behavior-name>', 'Name of the behavior')
    .action((instanceName, behaviorName) => {
        // TODO: Implement binding an instance to a behavior
        console.log(`Binding instance ${instanceName} to behavior ${behaviorName}`);
    });

instanceCommand
    .command('unbind')
    .description('Unbinds an instance from a behavior')
    .argument('<instance-name>', 'Name of the instance')
    .argument('<behavior-name>', 'Name of the behavior')
    .action((instanceName, behaviorName) => {
        // TODO: Implement unbinding an instance from a behavior
        console.log(`Unbinding instance ${instanceName} from behavior ${behaviorName}`);
    });

const behaviorCommand = program.command('behavior').description('Manage behaviors');

behaviorCommand
    .command('add')
    .description('Adds a new behavior')
    .argument('<path>', 'Path to the behavior directory')
    .action((path) => {
        // TODO: Implement adding a behavior
        console.log(`Adding behavior from ${path}`);
    });

behaviorCommand
    .command('search')
    .description('Searches for behaviors')
    .argument('<query>', 'Search query')
    .option('--semantic', 'Perform a semantic search')
    .action((query, options) => {
        // TODO: Implement searching for behaviors
        console.log(`Searching for behavior: ${query}`, options.semantic ? 'with semantic search' : '');
    });

behaviorCommand
    .command('update')
    .description('Updates a behavior')
    .argument('<name>', 'Name of the behavior to update')
    .argument('<path>', 'Path to the new behavior directory')
    .action((name, path) => {
        // TODO: Implement updating a behavior
        console.log(`Updating behavior ${name} with ${path}`);
    });

behaviorCommand
    .command('rm')
    .description('Deletes a behavior')
    .argument('<name>', 'Name of the behavior to delete')
    .action((name) => {
        // TODO: Implement deleting a behavior
        console.log(`Deleting behavior: ${name}`);
    });

program.parse(process.argv); 