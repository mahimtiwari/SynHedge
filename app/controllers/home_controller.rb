class HomeController < ApplicationController
  def index
    render inertia: {}
  end
end
