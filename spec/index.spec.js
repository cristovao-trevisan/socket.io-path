const io = require('socket.io')
const ioClient = require('socket.io-client')
const ioRouter = require('../index')

describe('socket.io-topic-router', () => {
  let server
  let client
  beforeEach(() => {
    server = io(10066)
  })
  it('should call listener with correct arguments and send message to client', (done) => {
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', (params, [arg1, arg2], next, socket) => {
      expect(params.bar).toEqual('1234')
      expect(arg1).toEqual('arg1')
      expect(arg2).toEqual('arg2')
      socket.emit('foo/1234', 'bar')
      next()
    })

    client = ioClient('http://localhost:10066')
    client.on('foo/1234', resp => {
      expect(resp).toEqual('bar')
      done()
    })
    client.emit('foo/1234', 'arg1', 'arg2')
  })

  it('should call only the last listener', (done) => {
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', () => {
      fail('Should not be called')
    })

    router.route('foo/:bar', () => {
      done()
    })

    let client = ioClient('http://localhost:10066')
    client.emit('foo/1234', 'arg1', 'arg2')
  })

  it('should not call slightly incorrect listener', (done) => {
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', (params, [arg1, arg2]) => {
      done()
    })

    router.route('fo0/:bar', (params, [arg1, arg2]) => {
      fail('Should not be called')
    })

    client = ioClient('http://localhost:10066')
    client.emit('foo/1234', 'arg1', 'arg2')
  })

  it('should still support socket.io events', (done) => {
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', (params, [arg1, arg2]) => {
      fail('Should not be called')
    })

    server.on('connection', socket => {
      socket.on('message', msg => {
        expect(msg).toEqual('foo/1234')
        done()
      })
    })

    client = ioClient('http://localhost:10066')
    client.send('foo/1234')
  })

  it('should support multiple listeners', (done) => {
    let router = ioRouter()
    server.use(router)

    var fistListener = (params, [arg1], next) => {
      expect(arg1).toEqual('arg1')
      next()
    }

    var secondListener = (params, [arg1], next, socket) => {
      expect(arg1).toEqual('arg1')
      socket.emit('foo/1234', 'bar')
      next()
    }
    router.route('foo/:bar', fistListener, secondListener)

    client = ioClient('http://localhost:10066')
    client.on('foo/1234', resp => {
      expect(resp).toEqual('bar')
      done()
    })
    client.emit('foo/1234', 'arg1')
  })

  it('should support stop chain on error (and call client)', (done) => {
    let router = ioRouter()
    server.use(router)

    router.route('foo/:bar', (params, [arg1], next) => {
      expect(arg1).toEqual('arg1')
      next(new Error('There is a problem'))
    })

    client = ioClient('http://localhost:10066')
    // for some reason this is called twice
    client.on('error', (err) => {
      if (err === 'There is a problem') {
        done()
      }
    })

    client.emit('foo/1234', 'arg1')
  })

  it('should support stop chain on error (and call client) with multiple listeners', (done) => {
    let router = ioRouter()
    server.use(router)

    var fistListener = (params, [arg1], next) => {
      expect(arg1).toEqual('arg1')
      next(new Error('There is a problem'))
    }

    var secondListener = (params, [arg1], next) => {
      fail('should not be called')
    }

    router.route('foo/:bar', fistListener, secondListener)

    client = ioClient('http://localhost:10066')
    // for some reason this is called twice
    client.on('error', (err) => {
      if (err === 'There is a problem') {
        done()
      }
    })

    client.emit('foo/1234', 'arg1')
  })

  it('should call next middleware', (done) => {
    let router = ioRouter()
    server.use(router)
    server.use((socket, next) => {
      socket.on('foo/1234', () => {
        done()
      })
      next()
    })
    router.route('foo/:bar', (params, [arg1, arg2], next) => {
      expect(params.bar).toEqual('1234')
      expect(arg1).toEqual('arg1')
      expect(arg2).toEqual('arg2')
      next()
    })

    client = ioClient('http://localhost:10066')
    client.emit('foo/1234', 'arg1', 'arg2')
  })

  it('should call next middleware with multiple callbacks', (done) => {
    let router = ioRouter()
    server.use(router)
    server.use((socket, next) => {
      socket.on('foo/1234', () => {
        done()
      })
      next()
    })

    var fistListener = (params, [arg1], next) => {
      expect(arg1).toEqual('arg1')
      next()
    }

    var secondListener = (params, [arg1], next) => {
      next()
    }

    router.route('foo/:bar', fistListener, secondListener)

    client = ioClient('http://localhost:10066')
    client.emit('foo/1234', 'arg1', 'arg2')
  })

  afterEach(() => {
    client && client.close()
    server.close()
  })
})
