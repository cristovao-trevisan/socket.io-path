const io = require('socket.io')
const ioClient = require('socket.io-client')
const ioRouter = require('../index')

describe('socket.io-path', () => {
  it('should call listerner with correct arguments', (done) => {
    let server = io(10066)
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', (params, arg1, arg2) => {
      expect(params.bar).toEqual('1234')
      expect(arg1).toEqual('arg1')
      expect(arg2).toEqual('arg2')
      done()
    })

    let client = ioClient('http://localhost:10066')
    client.emit('foo/1234', 'arg1', 'arg2')
  })
})
