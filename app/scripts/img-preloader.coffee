exports =

  cache: {}

  ###*
   * default preload options object
   *
   * @type {Object}
  ###
  options:
    src: null
    container: $()
    on_preload: ($img, o)->
      console.info "done preloading #{o.src}"


  preload: ->
    total = arguments.length
    complete = 0

    # callback function when all image object args
    # have loaded
    _on_complete = ->
      console.info "done preloading #{total} images"

    for arg in arguments
      o = $.extend {}, @options
      $.extend o, arg

      if o.src in @cache
        $o = @cache[o.src].cloneNode()
        console.info('loading from cache..')
      else
        $o = new Image()
        @cache[o.src] = $o

      $o.$container = o.$container
      $o.on_preload = o.on_preload

      $o.onload = ->
        complete += 1
        $ctx = $("<img src='#{@src}'>")

        console.log()

        if @$container?
          @$container.append $ctx

        if @on_preload?
          @on_preload($ctx, o)

        if complete is total
          _on_complete()
      $o.src = o.src
    @


module.exports = exports
