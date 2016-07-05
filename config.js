var convict = require('convict')
var fs = require('fs')
var path = require('path')

// Define a schema
var conf = convict({
  server: {
    host: {
      doc: 'The IP address the application will run on',
      format: 'ipaddress',
      default: '0.0.0.0'
    },
    port: {
      doc: 'The port number the application will bind to',
      format: 'port',
      default: 8080
    },
    name: {
      doc: 'Server name',
      format: String,
      default: 'DADI (CDN)'
    }
  },
  logging: {
    enabled: {
      doc: 'If true, logging is enabled using the following settings.',
      format: Boolean,
      default: false
    },
    level: {
      doc: 'Sets the logging level.',
      format: ['debug', 'info', 'warn', 'error', 'trace'],
      default: 'info'
    },
    path: {
      doc: 'The absolute or relative path to the directory for log files.',
      format: String,
      default: './log'
    },
    filename: {
      doc: 'The name to use for the log file, without extension.',
      format: String,
      default: 'cdn'
    },
    extension: {
      doc: 'The extension to use for the log file.',
      format: String,
      default: 'log'
    },
    fileRotationPeriod: {
      doc: "The period at which to rotate the log file. This is a string of the format '$number$scope' where '$scope' is one of 'ms' (milliseconds), 'h' (hours), 'd' (days), 'w' (weeks), 'm' (months), 'y' (years). The following names can be used 'hourly' (= '1h'), 'daily (= '1d'), 'weekly' ('1w'), 'monthly' ('1m'), 'yearly' ('1y').",
      format: String,
      default: '' // disabled
    },
    fileRetentionCount: {
      doc: 'The number of rotated log files to keep.',
      format: Number,
      default: 7 // keep 7 back copies
    },
    accessLog: {
      enabled: {
        doc: "If true, HTTP access logging is enabled. The log file name is similar to the setting used for normal logging, with the addition of 'access'. For example `cdn.access.log`.",
        format: Boolean,
        default: true
      },
      fileRotationPeriod: {
        doc: "The period at which to rotate the access log file. This is a string of the format '$number$scope' where '$scope' is one of 'ms' (milliseconds), 'h' (hours), 'd' (days), 'w' (weeks), 'm' (months), 'y' (years). The following names can be used 'hourly' (= '1h'), 'daily (= '1d'), 'weekly' ('1w'), 'monthly' ('1m'), 'yearly' ('1y').",
        format: String,
        default: '1d' // daily rotation
      },
      fileRetentionCount: {
        doc: 'The number of rotated log files to keep.',
        format: Number,
        default: 7 // keep 7 back copies
      },
      kinesisStream: {
        doc: 'An AWS Kinesis stream to write to log records to.',
        format: String,
        default: ''
      }
    }
  },
  aws: {
    accessKeyId: {
      doc: '',
      format: String,
      default: '',
      env: 'AWS_ACCESS_KEY'
    },
    secretAccessKey: {
      doc: '',
      format: String,
      default: '',
      env: 'AWS_SECRET_KEY'
    },
    region: {
      doc: '',
      format: String,
      default: '',
      env: 'AWS_REGION'
    }
  },
  images: {
    directory: {
      enabled: {
        doc: 'If true, image files will be loaded from the filesystem',
        format: Boolean,
        default: false
      },
      path: {
        doc: 'The path to the image directory',
        format: String,
        default: './images'
      }
    },
    s3: {
      enabled: {
        doc: 'If true, image files will be requested from Amazon S3',
        format: Boolean,
        default: false
      },
      accessKey: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_IMAGES_ACCESS_KEY'
      },
      secretKey: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_IMAGES_SECRET_KEY'
      },
      bucketName: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_IMAGES_BUCKET_NAME'
      },
      region: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_IMAGES_REGION'
      }
    },
    remote: {
      enabled: {
        doc: 'If true, image files will be requested from a remote host',
        format: Boolean,
        default: false
      },
      path: {
        doc: 'The remote host to request images from, for example http://media.example.com',
        format: String,
        default: ''
      }
    }
  },
  assets: {
    directory: {
      enabled: {
        doc: 'If true, asset files will be loaded from the filesystem',
        format: Boolean,
        default: false
      },
      path: {
        doc: '',
        format: String,
        default: './public'
      }
    },
    s3: {
      enabled: {
        doc: 'If true, asset files will be requested from Amazon S3',
        format: Boolean,
        default: false
      },
      accessKey: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_ASSETS_ACCESS_KEY'
      },
      secretKey: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_ASSETS_SECRET_KEY'
      },
      bucketName: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_ASSETS_BUCKET_NAME'
      },
      region: {
        doc: '',
        format: String,
        default: '',
        env: 'AWS_S3_ASSETS_REGION'
      }
    },
    remote: {
      enabled: {
        doc: 'If true, asset files will be requested from a remote host',
        format: Boolean,
        default: false
      },
      path: {
        doc: 'The remote host to request assets from, for example http://media.example.com',
        format: String,
        default: ''
      }
    }
  },
  caching: {
    ttl: {
      doc: '',
      format: Number,
      default: 3600
    },
    directory: {
      enabled: {
        doc: 'If true, cache files will be saved to the filesystem',
        format: Boolean,
        default: true
      },
      path: {
        doc: 'The relative path to the cache directory',
        format: String,
        default: './cache/'
      }
    },
    redis: {
      enabled: {
        doc: 'If true, cache files will be saved to the specified Redis server',
        format: Boolean,
        default: false
      },
      host: {
        doc: 'The Redis server host',
        format: String,
        default: '',
        env: 'REDIS_HOST'
      },
      port: {
        doc: 'The port for the Redis server',
        format: 'port',
        default: 6379,
        env: 'REDIS_PORT'
      },
      password: {
        doc: '',
        format: String,
        default: '',
        env: 'REDIS_PASSWORD'
      }
    }
  },
  status: {
  	enabled: {
      doc: "If true, status endpoint is enabled.",
      format: Boolean,
      default: true
    },
    requireAuthentication: {
      doc: "If true, status endpoint requires authentication.",
      format: Boolean,
      default: true
    },
    standalone: {
      doc: "If true, status endpoint will run on an standalone address/port.",
      format: Boolean,
      default: false
    },
    port: {
      doc: "Accept connections on the specified port. A value of zero will assign a random port.",
      format: Number,
      default: 8003,
      env: "STATUS_PORT"
    },
    routes: {
      doc: "An array of routes to test. Each route object must contain properties `route` and `expectedResponseTime`. Note, `expectedResponseTime` is seconds.",
      format: Array,
      default: [
        {
          route: '/test.jpg?format=png&quality=50&width=800&height=600',
          expectedResponseTime: 0.025
        }
      ]
    }
  },
  security: {
    maxWidth: {
      doc: '',
      format: Number,
      default: 2048
    },
    maxHeight: {
      doc: '',
      format: Number,
      default: 1024
    }
  },
  auth: {
    tokenUrl: {
      doc: '',
      format: String,
      default: '/token'
    },
    clientId: {
      doc: '',
      format: String,
      default: '1235488',
      env: "AUTH_TOKEN_ID"
    },
    secret: {
      doc: '',
      format: String,
      default: 'asd544see68e52',
      env: "AUTH_TOKEN_SECRET"
    },
    tokenTtl: {
      doc: '',
      format: Number,
      default: 1800,
      env: "AUTH_TOKEN_TTL"
    }
  },
  cloudfront: {
    enabled: {
      doc: '',
      format: Boolean,
      default: false
    },
    accessKey: {
      doc: '',
      format: String,
      default: '',
      env: "CLOUDFRONT_ACCESS_KEY"
    },
    secretKey: {
      doc: '',
      format: String,
      default: '',
      env: "CLOUDFRONT_SECRET_KEY"
    },
    distribution: {
      doc: '',
      format: String,
      default: '',
      env: "CLOUDFRONT_DISTRIBUTION"
    }
  },
  cluster: {
    doc: 'If true, CDN runs in cluster mode, starting a worker for each CPU core',
    format: Boolean,
    default: false
  },
  paths: {
    doc: "",
    format: Object,
    default: {
      recipes: __dirname + '/workspace/recipes'
    }
  },
  gzip: {
    doc: "If true, uses gzip compression and adds a 'Content-Encoding:gzip' header to the response",
    format: Boolean,
    default: true
  },
  headers: {
    useGzipCompression: {
      doc: "If true, uses gzip compression and adds a 'Content-Encoding:gzip' header to the response.",
      format: Boolean,
      default: true
    },
    cacheControl: {
      doc: "A set of cache control headers based on specified mimetypes or paths",
      format: Object,
      default: {
        "default": "public, max-age=3600",
        "paths": [],
        "mimetypes": [
          {"text/css": "public, max-age=86400"},
          {"text/javascript": "public, max-age=86400"},
          {"application/javascript": "public, max-age=86400"}
        ]
      }
    }
  },
  feedback: {
    doc: '',
    format: Boolean,
    default: false
  },
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development', 'test', 'qa'],
    default: 'development',
    env: 'NODE_ENV',
    arg: 'node_env'
  }

})

// Load environment dependent configuration
var env = conf.get('env')
conf.loadFile('./config/config.' + env + '.json')

// Perform validation
conf.validate({strict: false})

// Update Config JSON file by domain name
conf.updateConfigDataForDomain = function (domain) {
  if (fs.existsSync(path.resolve(__dirname + '/workspace/domain-loader/' + domain + '.config.' + env + '.json'))) {
    conf.loadFile(__dirname + '/workspace/domain-loader/' + domain + '.config.' + env + '.json')
  }
}

module.exports = conf

module.exports.configPath = function () {
  return './config/config.' + conf.get('env') + '.json'
}
