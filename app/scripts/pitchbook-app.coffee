book_tpl = require '../templates/book'
intro_video_tpl = require '../templates/intro-video'
pitchbook = require './pitchbook/book'
pitchbookBox = require './box'
preloader = require './img-preloader'


exports = {}
app = {inited: false}


$w = $(window)
$d = $(document)


app.user = {}
app.user.init = ->
  @ua = navigator.userAgent.toLowerCase()
  @isIpad = @ua.indexOf "ipad" > -1
  @isIPhone = @ua.indexOf "iphone" > -1 or @ua.indexOf "ipod" > -1
  @

app.user.init()


# prevent double submit
app.box_centering = (settings) ->
  if settings.$elements?
    settings.$elements = settings.$elements
  else
    settings.$elements = $(".box")

  settings.$elements.each ->
    $ctx = $(@)
    app.box_center $ctx, settings
    $ctx.css("visibility", "visible")
    $w.resize (e) ->
      app.box_center $ctx, settings


app.box_center = ($b, o) ->
  win_width = $w.width()
  box_height = $b.height()
  if box_height is 0
    box_height = $b.parent().height()
  win_height = $w.height() + (o.offsetY / 2)

  if win_height < box_height
    if o.animate is true
      $b.animate {top: 20}, 600, "easeInOutExpo"
    else
      $b.css("top", 20)

  else
    if o.animate is true
      $b.animate(
        {top: ((win_height / 2) - (box_height / 2))},
        600, "easeInOutExpo")
    else
      $b.css "top", (win_height / 2) - (box_height / 2)

  if win_width * 2 < 1000
    $b.css("left", 500)

  else
    $b.css("left", (win_width / 2))


app.on_box_close = ->
  $('.nav-btn.teaser').removeClass 'selected'
  $('.nav-btn.overview').addClass 'selected'
  app.box.settings.$container.css("opacity", 1)
  try
    app.show_book()
  catch ex


app.init = ->
  app.book = {}

  $d.on 'pitchbookBox-reveal-after', ->
    app.box_centering {
      $elements: $('.box')
      offsetY: -75
      animate: false
    }

    if not app.inited
      preloader.preload {
        src: '/images/pitchbook-sprites.png'
        on_preload: ($img, o)->
          console.info 'done preloading #{o.src}'
      }
      app.init_book()

  $d.on 'pitchbookBox-overlay-show-after', ->
    app.box.settings.$overlay.css("opacity", 0.7)

  $d.on 'pitchbookBox-content-hide-after', ->
    app.on_box_close()

  $('.nav-btn.teaser').on 'click', ->
    app.set_teaser_view()

  $('.nav-btn.overview').on 'click', ->
    app.set_overview_view()

  $('.nav-btn.contact').on 'click', ->
    window.location.href = 'mailto:info@pitchbook.appspot.com'

  $d.on 'pitchbookBox-overlay-show-after', ->
    if app.book.hide?
      app.book.hide()

  app.start()


app.start = ->
  app.box = new pitchbookBox.PitchbookBox {
    html: intro_video_tpl {}
    overlay: true
    animate_in: false
    center_top: false
  }
  app.center_book()
  app.box.settings.$container.data 'locked', true


app.center_book = ->
  $el = $('.body-inner')
  padding = 70
  win_bounds =
    h: $w.height()
  bounds =
    h: $el.height() + padding,
    t: $el.offset().top

  pos =
    t: Math.ceil(((win_bounds.h / 2) - (bounds.h / 2)) + 30)

  if bounds.h is 0 or win_bounds.h is 0
    return app.center_book()

  if win_bounds.h < $el.parent().height()
    pos.t = padding

  $el.css { top: pos.t, margin: 0 }
  @


app.show_book = ->
  @box.settings.$container.data 'locked', false
  @book.$outer.css("opacity", 1)
  @


app.init_book = ->
  if app.inited
    return
  app.inited = true
  spreads = [
    {
      left: {url: '/images/spreads/spread_01a.jpg'},
      right: {url: '/images/spreads/spread_01b.png'}},
    {
      left: {url: '/images/spreads/spread_02a.jpg'},
      right: {url: '/images/spreads/spread_02b.png'}},
    {
      left: {url: '/images/spreads/spread_03a.jpg'},
      right: {url: '/images/spreads/spread_03b.jpg'}},
    {
      left: {url:'/images/spreads/spread_04a.png'},
      right: {url:'/images/spreads/spread_04b.png'}},
    {
      left: {url:'/images/spreads/spread_05a.jpg'},
      right: {url:'/images/spreads/spread_05b.jpg'}},
    {
      left: {url:'/images/spreads/spread_06a.jpg'},
      right: {url:'/images/spreads/spread_06b.jpg'}},
    {
      left: {url:'/images/spreads/spread_07a.png'},
      right: {url:'/images/spreads/spread_07b.png'}},
    {
      left: {url:'/images/spreads/spread_08a.png'},
      right: {url:'/images/spreads/spread_08b.png'}},
  ]

  $book = $('[data-book-container]')
  $book.html book_tpl()

  app.book = new pitchbook.Pitchbook({
    $container: $book
    spreads: spreads
    SPREAD_WIDTH: 850
    SPREAD_HEIGHT: 550
    PAGE_WIDTH: 425
    PAGE_HEIGHT: 550
    ANIM_INTERVAL_RATE: 10
    MOVE_NEXT_SPEED: 40
    MOVE_PREV_SPEED: 40
    EASE: 0.45
    AUTO_SHOW: false
    VERTICAL_OUTDENT: 0
    SLOW_MOTION: false
    # SLOW_MOTION: true
    # AUTO_PRELOAD: false
  })

  $('[data-action="pitchbook-spread-change"]').on 'click', (e)->
    e.preventDefault()
    $el = $(@)
    book_id = $el.data("book")
    action = $el.data("action")
    direction = $el.data("direction")
    $('[data-book-container="#{book_id}"]')
      .trigger(action, [direction])

  $w.on "resize", ->
    app.center_book()
  app.center_book()


app.set_teaser_view = ->
  $('.nav-btn.teaser').addClass 'selected'
  $('.nav-btn.overview').removeClass 'selected'
  app.start()
  if app.book?
    app.book.hide()


app.set_overview_view = ->
  app.box.settings.$container.data 'locked', false
  $('.nav-btn.overview').addClass 'selected'
  $('.nav-btn.teaser').removeClass 'selected'
  $d.trigger 'pitchbookBox-close'


exports.app = app
module.exports = exports
