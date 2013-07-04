Page = require './page'
spread_tpl = require '../../templates/spread'


module.exports = class Spread

  constructor: (o)->
    @loaded = false
    @data = o.data
    @index = o.index
    @book = o.book
    # this creates the reverse stacking..
    @zindex = @book.total_spreads - @index
    @pages = {}
    @$el = @create_el()
    # @$el.append @$want_el
    @addleft()
    @addright()
    @


  create_el: ->
    $rv = $(spread_tpl())
    $rv
      .css({
        position: "absolute"
        overflow: "hidden"
        width: @book.settings.PAGE_WIDTH * 2
        height: @book.settings.PAGE_HEIGHT
        zIndex: @zindex
      })
    $rv


  addpage: (opts)->
    page = new Page(@, opts)
    @$el.append page.$el
    @pages[opts.side] = page
    return @pages[opts.side]


  addleft: ->
    page = @addpage({
      side: "left"
      spread: @
      book: @book
      settings: @data.left
    })
    page.$el.css("left", 0)
    @left = page
    @


  addright: ->
    page = @addpage({
      side: "right"
      spread: @
      book: @book
      settings: @data.right
    })
    page.$el.css("left", @book.settings.PAGE_WIDTH)
    @right = page
    @


  reset: ->
    @pages.left.$el.css({
      width: @book.settings.PAGE_WIDTH
      left: 0
    })
    @pages.right.$el.css({
      width: @book.settings.PAGE_WIDTH
      left: @book.settings.PAGE_WIDTH
    })
    @
