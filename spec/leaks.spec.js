const { iterate } = require('leakage')
const io = require('socket.io')
const ioClient = require('socket.io-client')
const ioRouter = require('../index')

describe('leaks', () => {
  let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
  })

  it('one callback', done => {
    let server = io(10066)
    let router = ioRouter()
    server.use(router)
    router.route('foo/:bar', (params, args, next, socket) => {
      socket.emit('foo/' + params.bar)
    })

    iterate.async(() => {
      return new Promise(resolve => {
        let client = ioClient('http://localhost:10066') // eslint-disable-line
        client.on('connect', () => {
          client.emit('foo/bar')
        })
        client.on('foo/bar', () => {
          client.disconnect()
        })
        client.on('disconnect', () => {
          resolve()
        })
      })
    }).then(() => {
      server.close(done)
    }).catch(err => {
      server.close(() => done.fail(err))
    })
  })

  it('multiple callbacks', done => {
    let server = io(10066)
    let router = ioRouter()
    let createLeak = []
    server.use(router)
    router.route('foo/:bar', (params, args, next, socket) => {
      socket.emit('foo/' + params.bar)
      // next() // -> this line should create an error
    }, (params, args, next) => {
      // should not enter here
      createLeak = createLeak.concat(new Array(2000).fill(1))
    })

    iterate.async(() => {
      return new Promise(resolve => {
        let client = ioClient('http://localhost:10066') // eslint-disable-line
        client.on('connect', () => {
          client.emit('foo/bar')
        })
        client.on('foo/bar', () => {
          client.disconnect()
        })
        client.on('disconnect', () => {
          resolve()
        })
      })
    }).then(() => {
      server.close(done)
    }).catch(err => {
      server.close(() => done.fail(err))
    })
  })

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  })
})
