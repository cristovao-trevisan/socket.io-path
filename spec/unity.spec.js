const io = require('socket.io')
const ioClient = require('socket.io-client')
const ioRouter = require('../index')

describe('unity', () => {
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

  it('should give the correct socket as parameter', (done) => {
    let router = ioRouter()
    server.use(router)

    router.route('foo/:bar', (params, [msg], next, socket) => {
      socket.emit('foo/' + params.bar, msg)
      next()
    })

    client = ioClient('http://localhost:10066')
    let client2 = ioClient('http://localhost:10066')
    let client3 = ioClient('http://localhost:10066')

    client.on('foo/1234', resp => {
      expect(resp).toEqual('client1')
      client2.emit('foo/1234', 'client2')
    })
    client2.on('foo/1234', resp => {
      expect(resp).toEqual('client2')
      client3.emit('foo/1234', 'client3')
    })
    client3.on('foo/1234', resp => {
      expect(resp).toEqual('client3')
      client2.close()
      client3.close()
      done()
    })
    client.emit('foo/1234', 'client1')
  })

  afterEach((done) => {
    client && client.close()
    server.close(done)
  })
})
