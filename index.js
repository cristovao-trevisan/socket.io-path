const pathToRegexp = require('path-to-regexp')

/**
* @description Used to create a middleware for each exported library call
*/
class Middleware {
  constructor () {
    // route regex
    this.routes = []
    // keys for each route above (set by pathToRegexp)
    this.keys = []
    // listener for each route above
    this.listeners = []
    this.registerSocket = this.registerSocket.bind(this)
    this.register = this.register.bind(this)
    this.route = this.route.bind(this)
  }

  /**
   * @description Function passed to socket.io to register middlware (-> io.use(register))
   * @param {Object} socket Socket.io socket
   * @param {function} next
  */
  register (socket, next) {
    socket.use(this.registerSocket)
    next()
  }

  /**
   * @description Used to register each socket (=>socket.use(registerSocket)), called by {@link Middleware.register}
   * @param {Array} packet Array with topic + args
   * @param {function} next
  */
  registerSocket (packet, next) {
    let topic = packet[0]
    this.routes.reverse().forEach((route, i) => {
      let resp = route.exec(topic)
      if (resp) {
        let params = {}
        this.keys[i].forEach((key, idx) => {
          params[key.name] = resp[idx + 1]
        })
        this.listeners[i](params, ...packet.slice(1))
        return next()
      }
    })
    next()
  }
  /**
  * @callback listenerCallback
  * @description This callback is given for each path match
  * @param {string[]} params Parameters from path
  * @param {...*} args Data from message (except topic)
  */

  /**
  * @param {string} path Express like path (Ex.: '/user/:id/picture')
  * @param {listenerCallback} listener Callback for route
  */
  route (path, listener) {
    var keys = []
    var regex = pathToRegexp(path, keys)
    this.keys.push(keys)
    this.routes.push(regex)
    this.listeners.push(listener)
  }
}

/**
* @description Function that encapsulates the class above
*/
const SocketIOMiddleware = function () {
  var instance = new Middleware()
  var call = function (packet, next) {
    instance.register(packet, next)
  }
  call.route = instance.route

  return call
}

module.exports = SocketIOMiddleware
