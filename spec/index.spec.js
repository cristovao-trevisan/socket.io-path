const io = require('socket.io')
const ioClient = require('socket.io-client')
const ioRouter = require('../index')

describe('socket.io-topic-router', () => {
  let server
  beforeEach(() => {
    server = io(10066)
  })
  it('should call listener with correct arguments', (done) => {
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', (params, arg1, arg2) => {
      expect(params.bar).toEqual('1234')
      expect(arg1).toEqual('arg1')
      expect(arg2).toEqual('arg2')

      client.close()
      server.close()
      done()
    })

    let client = ioClient('http://localhost:10066')
    client.emit('foo/1234', 'arg1', 'arg2')
  })

  it('should call only the last listener', (done) => {
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', () => {
      fail('Should not be called')
      done()
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
    router.route('foo/:bar', (params, arg1, arg2) => {
      done()
    })

    router.route('fo0/:bar', (params, arg1, arg2) => {
      fail('Should not be called')
      done()
    })

    let client = ioClient('http://localhost:10066')
    client.emit('foo/1234', 'arg1', 'arg2')
  })

  afterEach(() => {
    server.close()
  })
})
