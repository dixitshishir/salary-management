require "rails_helper"

RSpec.describe "Insights API" do
  let(:json) { response.parsed_body }

  before do
    create(:employee, country_code: "IN", salary: 1_000_000, job_title: "Software Engineer")
    create(:employee, country_code: "US", salary: 120_000, job_title: "Software Engineer")
  end

  it "GET /api/insights/overview returns org-wide totals" do
    get "/api/insights/overview"

    expect(json).to include("headcount" => 2, "country_count" => 2)
  end

  it "GET /api/insights/countries returns a row per country" do
    get "/api/insights/countries"

    expect(json.map { |row| row["country_code"] }).to contain_exactly("IN", "US")
  end

  it "GET /api/insights/job_titles requires a country" do
    get "/api/insights/job_titles"

    expect(response).to have_http_status(:bad_request)
  end

  it "GET /api/insights/job_titles returns job titles in that country" do
    get "/api/insights/job_titles", params: { country_code: "IN" }

    expect(json).to include("country_code" => "IN", "currency" => "INR")
    expect(json["job_titles"].map { |row| row["job_title"] }).to eq([ "Software Engineer" ])
  end

  it "GET /api/insights/outliers returns flagged employees and a total" do
    get "/api/insights/outliers", params: { threshold: 0.2 }

    expect(json).to include("outliers" => [], "total_count" => 0)
  end

  describe "POST /api/insights/raise_simulation" do
    it "returns the cost of the raise" do
      post "/api/insights/raise_simulation", params: { percent: 10, country_code: "US" }

      expect(json).to include("affected_headcount" => 1, "raise_cost_usd" => 12_000)
    end

    it "rejects an invalid percentage" do
      post "/api/insights/raise_simulation", params: { percent: 500 }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]).to match(/between 0 and 100/)
    end
  end
end
