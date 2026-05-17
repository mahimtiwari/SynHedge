require "net/http"
require "json"

class ApiController < ApplicationController
  skip_before_action :verify_authenticity_token

  def companies_suggestion
    query = params[:query]

    apikey = ENV["POLYGON_API_KEY"]

    uri = URI("https://api.polygon.io/v3/reference/tickers?search=#{query}&active=true&market=stocks&limit=5&apiKey=#{apikey}")

    response = Net::HTTP.get(uri)
    data = JSON.parse(response)


    render json: { message: "ok", query: query, data: data }
  end


  def companies_data
    ticker = params[:query]
    from = "2026-02-12"
    to = "2026-02-13"
    timespan = "minute"
    multiplier = 1

    apikey = ENV["POLYGON_API_KEY"]

    uri = URI(
      "https://api.polygon.io/v2/aggs/ticker/#{ticker}/range/#{multiplier}/#{timespan}/#{from}/#{to}?apiKey=#{apikey}"
    )

    response = Net::HTTP.get(uri)
    data = JSON.parse(response)


    render json: { message: "ok", query: ticker, data: data }
  end
end
