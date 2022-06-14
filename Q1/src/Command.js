export class CommandManager {
  constructor(emptyCb) {
    this.history = [];
    this.emptyCb = emptyCb || (() => {});
  }

  exec(command) {
    command.exec();
    this.history.push(command);
  }

  undo() {
    const command = this.history.pop();
    if (command) command.undo();
    else this.emptyCb();
  }
}
