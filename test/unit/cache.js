var should = require('should')
var fs = require('fs')
var path = require('path')
var sinon = require('sinon')
var proxyquire = require('proxyquire')
var redis = require('redis')
var fakeredis = require('fakeredis')

var Router = require('router')
var router = Router()

var config
var cache
var imageHandler = require(__dirname + '/../../dadi/lib/handlers/image')

var testConfigString

describe('Cache', function (done) {
  beforeEach(function (done) {
    delete require.cache[__dirname + '/../../dadi/lib/cache']
    cache = require(__dirname + '/../../dadi/lib/cache')

    delete require.cache[__dirname + '/../../config']
    config = require(__dirname + '/../../config')

    testConfigString = fs.readFileSync(config.configPath())

    done()
  })

  afterEach(function (done) {
    delete require.cache[__dirname + '/../../dadi/lib/cache']
    fs.writeFileSync(config.configPath(), testConfigString)
    done()
  })

  it('should export an instance', function (done) {
    cache.should.be.Function
    done()
  })

  it("should cache if the app's directory config settings allow", function (done) {
    var newTestConfig = JSON.parse(testConfigString)
    newTestConfig.caching.directory.enabled = true
    newTestConfig.caching.redis.enabled = false
    fs.writeFileSync(config.configPath(), JSON.stringify(newTestConfig, null, 2))

    config.loadFile(config.configPath())

    cache.reset()

    var req = {
      url: '/jpg/50/0/0/801/478/0/0/0/2/aspectfit/North/0/0/0/0/0/test.jpg'
    }

    var im = new imageHandler('jpg', req)

    im.cache.enabled.should.eql(true)

    done()
  })

  it("should not cache if the app's config settings don't allow", function (done) {
    var newTestConfig = JSON.parse(testConfigString)
    newTestConfig.caching.directory.enabled = false
    newTestConfig.caching.redis.enabled = false
    fs.writeFileSync(config.configPath(), JSON.stringify(newTestConfig, null, 2))

    config.loadFile(config.configPath())

    cache.reset()

    var req = {
      url: '/jpg/50/0/0/801/478/0/0/0/2/aspectfit/North/0/0/0/0/0/test.jpg'
    }

    var imageHandler = proxyquire('../../dadi/lib/handlers/image', {'Cache': cache})
    var im = new imageHandler('jpg', req)

    im.cache.enabled.should.eql(false)

    done()
  })

  it("should cache if the app's redis config settings allow", function (done) {
    var newTestConfig = JSON.parse(testConfigString)
    newTestConfig.caching.directory.enabled = false
    newTestConfig.caching.redis.enabled = true
    newTestConfig.caching.redis.host = '127.0.0.1'
    fs.writeFileSync(config.configPath(), JSON.stringify(newTestConfig, null, 2))

    config.loadFile(config.configPath())

    cache.reset()

    // stub calls the redis createClient
    sinon.stub(redis, 'createClient', fakeredis.createClient)

    var req = {
      url: '/jpg/50/0/0/801/478/0/0/0/2/aspectfit/North/0/0/0/0/0/test.jpg'
    }

    var im = new imageHandler('jpg', req)

    redis.createClient.restore()

    im.cache.redisClient.should.exist

    done()
  })

  it("should fallback to directory caching when Redis errors with CONNECTION_BROKEN", function (done) {
    var newTestConfig = JSON.parse(testConfigString)
    newTestConfig.caching.directory.enabled = false
    newTestConfig.caching.redis.enabled = true
    newTestConfig.caching.redis.host = '127.0.0.1'
    fs.writeFileSync(config.configPath(), JSON.stringify(newTestConfig, null, 2))

    config.loadFile(config.configPath())

    cache.reset()

    // stub calls the redis createClient
    sinon.stub(redis, 'createClient', fakeredis.createClient)

    var req = {
      url: '/jpg/50/0/0/801/478/0/0/0/2/aspectfit/North/0/0/0/0/0/test.jpg'
    }

    var im = new imageHandler('jpg', req)

    redis.createClient.restore()

    config.get('caching.directory.enabled').should.eql(false)
    config.get('caching.redis.enabled').should.eql(true)

    cache().redisClient.should.exist
    cache().redisClient.emit('error', { code: 'CONNECTION_BROKEN' })

    config.get('caching.directory.enabled').should.eql(true)
    config.get('caching.redis.enabled').should.eql(false)

    done()
  })

  it("should fallback to directory caching when Redis errors with ECONNREFUSED", function (done) {
    var newTestConfig = JSON.parse(testConfigString)
    newTestConfig.caching.directory.enabled = false
    newTestConfig.caching.redis.enabled = true
    newTestConfig.caching.redis.host = '127.0.0.1'
    fs.writeFileSync(config.configPath(), JSON.stringify(newTestConfig, null, 2))

    config.loadFile(config.configPath())

    cache.reset()

    // stub calls the redis createClient
    sinon.stub(redis, 'createClient', fakeredis.createClient)

    var req = {
      url: '/jpg/50/0/0/801/478/0/0/0/2/aspectfit/North/0/0/0/0/0/test.jpg'
    }

    var im = new imageHandler('jpg', req)

    redis.createClient.restore()

    config.get('caching.directory.enabled').should.eql(false)
    config.get('caching.redis.enabled').should.eql(true)

    cache().redisClient.should.exist
    cache().redisClient.emit('error', { code: 'ECONNREFUSED' })

    config.get('caching.directory.enabled').should.eql(true)
    config.get('caching.redis.enabled').should.eql(false)

    done()
  })
})
