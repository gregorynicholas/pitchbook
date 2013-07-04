 # See http://brunch.readthedocs.org/en/latest/config.html for documentation.
exports.config =
  files:
    javascripts:
      joinTo:
        'javascripts/app.js': /^app/
        'javascripts/vendor.js': /^vendor\/scripts/
      order:
        before: [
          'vendor/scripts/jquery-2.0.2.js'
          'vendor/scripts/consolelog.js'
        ]

    stylesheets:
      joinTo:
        'stylesheets/app.css': /app\/styles\/.*\.css/
      order:
        before: [
          # 'vendor/styles/normalize.css'
        ]
        after: [
          # 'vendor/styles/helpers.css'
        ]

    templates:
      joinTo: 'javascripts/app.js'

  conventions:
    assets: /(^vendor.*|^app|^test)\/assets\//

  coffeelint:
    pattern: /^app\/.*\.coffee$/
    options:
      max_line_length:
        value: 100
        level: "error"
      indentation:
        value: 2
        level: "error"
