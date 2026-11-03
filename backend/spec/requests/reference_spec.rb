require "rails_helper"

RSpec.describe "GET /api/reference" do
  it "lists countries with currencies and the departments and job titles in use" do
    create(:employee, department: "Sales", job_title: "Account Manager")
    create(:employee, department: "Engineering", job_title: "Software Engineer")

    get "/api/reference"

    body = response.parsed_body
    expect(body["countries"]).to include({ "code" => "IN", "name" => "India", "currency" => "INR" })
    expect(body["departments"]).to eq(%w[Engineering Sales])
    expect(body["job_titles"]).to eq([ "Account Manager", "Software Engineer" ])
    expect(body["employment_types"]).to eq(%w[full_time part_time contract])
  end
end
