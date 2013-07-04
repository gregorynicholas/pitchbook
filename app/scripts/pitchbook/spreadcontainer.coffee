spreads_container_tpl = require '../../templates/spreads_container'


module.exports = class SpreadContainer

  constructor: ->
    @spreads = []
    @$el = @create_el()
    @

  create_el: ->
    $el = $(spreads_container_tpl())
    $el

  set_spreads: (spreads)->
    @spreads = spreads
    for spread in spreads
      @$el.append spread.$el
    @
