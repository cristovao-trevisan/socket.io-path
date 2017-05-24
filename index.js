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
    this.onPacket = this.onPacket.bind(this)
    this.register = this.register.bind(this)
    this.route = this.route.bind(this)
  }

  /**
   * @description Function passed to socket.io to register middlware for each socket (-> io.use(register))
   * @param {Object} socket Socket.io socket
   * @param {function} next
  */
  register (socket, next) {
    var call = (packet, next) => {
      this.onPacket(socket, packet, next)
    }
    socket.use(call)
    next()
  }

  /**
   * ΨHell madeΨ function to build an executable chain for the given listeners
   * @private
   * @param {listenerCallback[]} listeners Listeners array
   * @param {Function} onComplete call after last next is called
   * @return {Function} The return is a constructor for the chain that needs 2 arguments, params and args
   */
  buildChain (listeners, onComplete) {
    // Initial last function
    var lastFunc = onComplete
    // For each listener (reversed)
    for (let i = listeners.length - 1; i >= 0; i--) {
      // lastFunc = function that calls the next listener (current lastFunc) with
      // the same arguments
      lastFunc = (function (next) {
        let call = (param, args, socket) => {
          return (err) => {
            if (err) {
              onComplete(err)
            } else {
              next(param, args, socket)
            }
          }
        }
        return (param, args, socket) => {
          listeners[i](param, args, call(param, args, socket), socket)
        }
      })(lastFunc)
    }
    // return the constructor for the first listener on the chain
    return lastFunc
  }

  /**
   * @description Called for each received packet
   * @private
   * @param {Array} packet Array with topic + args
   * @param {function} next
  */
  onPacket (socket, packet, next) {
    let topic = packet[0]
    let resp = null
    for (let i = this.routes.length - 1; i >= 0; i--) {
      var route = this.routes[i]
      resp = route.exec(topic)
      if (resp) {
        let params = {}
        this.keys[i].forEach((key, idx) => {
          params[key.name] = resp[idx + 1]
        })
        if (this.listeners[i] instanceof Array) {
          // for multiple listeners build a chain and expect the onComplete call
          this.buildChain(this.listeners[i], (err) => {
            if (err !== params) {
              next(err)
            } else {
              next()
            }
          })(params, packet.slice(1), socket)
          return
        } else {
          // for one listener just call it
          this.listeners[i](params, packet.slice(1), err => {
            next(err)
          }, socket)
          return
        }
      }
    }
    next()
  }
  /**
  * @callback listenerCallback
  * @description This callback is given for each path match
  * @param {string[]} params Parameters from path
  * @param {string[]} args Data from message (except topic)
  * @param {function} next Function that must be called after callback execution (only param is err, if any)
  * @param {io.Socket} socket The socket that got the message
  */

  /**
  * @param {string} path Express like path (Ex.: '/user/:id/picture')
  * @param {...listenerCallback} listener Callback for route
  */
  route (path, listener) {
    var keys = []
    var regex = pathToRegexp(path, keys)
    this.keys.push(keys)
    this.routes.push(regex)
    if (arguments.length > 2) {
      this.listeners.push([].slice.call(arguments).slice(1))
    } else {
      this.listeners.push(listener)
    }
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
