page_tpl = require '../../templates/page'
page_overlay_tpl = require '../../templates/page_overlay'


module.exports = class Page

  constructor: (spread, o)->
    @loaded = false
    @settings = o.settings
    @side = o.side
    @spread = spread
    @book = o.book
    @$overlay = @create_overlay_el()
    @$el = @create_el()
    @progress = 1
    @

  create_el: ->
    $rv = $(page_tpl({ side: @side }))
    $rv
      .css({
        position: "absolute"
        overflow: "hidden"
        width: @book.settings.PAGE_WIDTH
        height: @book.settings.PAGE_HEIGHT
        # zIndex: 20
      })
      .append(@$overlay)
    $rv

  create_overlay_el: ->
    $rv = $(page_overlay_tpl())
    $rv.css({
      width: @book.settings.PAGE_WIDTH
      height: @book.settings.PAGE_HEIGHT
    })
    $rv
