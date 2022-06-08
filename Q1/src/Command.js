export class Command {
  constructor(exec, undo) {
    this.prev;
    this.exec = exec;
    this.undo = undo;
  }
}

export class CommandManager {
  constructor() {
    this.history = [];
  }

  exec(command) {
    command.exec();
    this.history.push(command);
  }

  undo() {
    const command = this.history.pop();
    command.undo();
  }
}
