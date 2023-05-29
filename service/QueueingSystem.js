class QueueingSystem {
    #stack;

    constructor() {
        this.#stack = [];

        this.#processQueue();
    }

    /*
    * @param toProcess
    * @return Promise
    */
    addToQueue(toProcess) {
        let resolver;
        let promise = new Promise((resolve, reject) => resolver = resolve);
        this.#stack.push({
            'resolver': resolver,
            'toProcess': toProcess
        });
        return promise;
    }

    async #processQueue() {
        while (true) {
            let task = this.#stack.shift();

            if (task !== undefined) {
                task.resolver(await task.toProcess());
            }

            await this.#delay(500);
        }
    }

    async #delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
}

const queueingSystem = new QueueingSystem();

Object.freeze(queueingSystem);

module.exports = queueingSystem;