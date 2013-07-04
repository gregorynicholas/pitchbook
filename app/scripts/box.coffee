loading_tpl = require '../templates/loading'
image_tpl = require '../templates/image'


exports = {}


$d = $(document)


# public, $.fn methods

exports.PitchbookBox = class PitchbookBox

  constructor: (settings)->
    @settings =
      $container   : $("#pitchbookBox")
      $overlay     : $('#pitchbookBox-overlay')
      opacity      : 0.35
      has_overlay  : true
      animate_in   : true
      animate_out  : true
      imageTypes   : [ 'png', 'jpg', 'jpeg', 'gif' ]

    if settings?
      $.extend @settings, settings
    @settings.$container.css "visibility", "hidden"

    imageTypes = @settings.imageTypes.join '|'
    @settings.imgTypesRE = new RegExp '\\.(#{imageTypes})(\\?.*)?$', 'i'
    if settings
      $.extend @settings, settings
    @bind()
    @init()


  init: (data_type)->
    $d.trigger 'pitchbookBox-init'
    @loading()
    @inited = true
    if @settings.ajax?
      return @_set_content_from_ajax @settings.ajax, data_type

    else if @settings.image?
      return @_set_content_from_image @settings.image, data_type

    else if @settings.div?
      return @_set_content_from_href @settings.div, data_type

    else if @settings.html?
      return @_set_content_from_html @settings.html, data_type

    else if $.isFunction @settings
      return @_set_content_from_callback @settings

    else
      return @reveal @settings, data_type


  bind: ->
    ctx = @
    $d.on 'pitchbookBox-close', ->
      ctx.close()

    $d.on 'click', '[action="pitchbookBox-close"]', (e)->
      e.preventDefault()
      $d.trigger 'pitchbookBox-close'


  close: ->
    if @settings.$container.data 'locked'
      return
    $d.trigger 'pitchbookBox-close-before'

    $d.off 'keydown.pitchbookBox'
    if @settings.$container.length < 1
      $d.trigger 'pitchbookBox-close-after'
      return @hide_overlay()

    @hide_content()
    @hide_overlay()
    $d.trigger 'pitchbookBox-close-after'


  loading: ->
    $d.trigger 'pitchbookBox-loading-before'

    if @settings.$container.find('.loading').length > 0
      return

    @show_overlay()
    @settings.$container
      .css({ display:'block' })
      .find('.pitchbookBox-content')
      .append loading_tpl()

    ctx = @
    $d.on 'keydown.pitchbookBox', (e)->
      switch e.keyCode
        when 27
          return ctx.close()
    $d.trigger 'pitchbookBox-loading-after'


  _set_content_from_href: (href, data_type)->
    # div
    if href.match /#/
      url = window.location.href.split('#')[0]
      target = href.replace url,''
      if target is '#'
        return
      @reveal $(target).html(), data_type

    # image
    else if href.match @settings.imgTypesRE
      return _set_content_from_image href, data_type

    # ajax
    else
      return _set_content_from_ajax href, data_type


  _set_content_from_html: (html, data_type)->
    $el = $(html).html()
    @reveal($el, data_type)


  _set_content_from_image: (href, data_type)->
    img = new Image()
    img.onload = ->
      @reveal(image_tpl({ image_src: img.src }), data_type)
    img.src = href
    img


  _set_content_from_ajax: (href, data_type)->
    $.get href, (data)->
      @reveal data, data_type


  _set_content_from_callback: (fn)->
    return fn.call @


  reveal: (contents)->
    $d.trigger 'pitchbookBox-reveal-before'
    @settings.$container
      .find('.pitchbookBox-content')
        .empty()
        .append contents

    # reset the top style value for the #pitchbookBox element
    if @settings.center_top
      $w = $(window)
      @settings.$container
        .css "top", w.scrollTop() + ($w.height() / 2)

    if @settings.animate_in
      cb = ->
        $d.trigger 'pitchbookBox-reveal-animateIn'
      @settings.$container
        .css {opacity: 0}
        .animate {opacity: 1}, 500, cb

    $d.trigger 'pitchbookBox-reveal-after'


  skip_overlay: ->
    return not @settings.has_overlay or @settings.$container.data 'locked'


  show_overlay: ->
    if @skip_overlay()
      return
    $d.trigger 'pitchbookBox-overlay-show-before'
    cb = ->
      $d.trigger 'pitchbookBox-overlay-show-after'
    @settings.$overlay
      .css({display: 'block', opacity: 0})
      .removeClass('pitchbookBox-hide')
      .animate {opacity: 0.35}, 400, 'easeOutExpo', cb


  hide_overlay: ->
    if @skip_overlay()
      return
    $d.trigger 'pitchbookBox-overlay-hide-before'
    $el = @settings.$overlay
    $el.animate {opacity: 0}, 150, ->
      $el
        .css("display", 'none')
        .addClass('pitchbookBox-hide')
      $d.trigger 'pitchbookBox-overlay-hide-after'


  hide_content: ->
    $d.trigger 'pitchbookBox-content-hide-before'
    ctx = @
    @settings.$container.animate {opacity: 0}, 250, ->
      ctx.settings.$container
        .find('.pitchbookBox-content').empty()
      ctx.settings.$container
        .find('.loading').remove()
      $d.trigger 'pitchbookBox-content-hide-after'


module.exports = exports
