export default class PubSub {
  constructor() {
    // Storage for topics that can be broadcast
    // or listened to
    this.topics = {};

    // A topic identifier
    this.subUid = -1;
  }

  publish(topic, context) {
    if (!this.topics[topic]) {
      return false;
    }

    const subscribers = this.topics[topic];
    for (const { func } of subscribers) {
      func(context);
    }

    return this;
  }

  subscribe(topic, func) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }

    const token = (++this.subUid).toString();
    this.topics[topic].push({
      token,
      func,
    });
    return token;
  }

  unsubscribe(token) {
    for (const m in this.topics) {
      if (this.topics[m]) {
        for (let i = 0, j = this.topics[m].length; i < j; i++) {
          if (this.topics[m][i].token === token) {
            this.topics[m].splice(i, 1);

            return token;
          }
        }
      }
    }
    return this;
  }
}
