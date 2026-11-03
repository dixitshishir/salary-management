require "rails_helper"

RSpec.describe "Employee CSV endpoints" do
  def upload(content)
    Rack::Test::UploadedFile.new(StringIO.new(content), "text/csv", original_filename: "employees.csv")
  end

  describe "GET /api/employees/export" do
    it "downloads the employees matching the current filters" do
      create(:employee, country_code: "IN", first_name: "Asha")
      create(:employee, country_code: "US", first_name: "Liam")

      get "/api/employees/export", params: { country_code: "US" }

      expect(response.media_type).to eq("text/csv")
      expect(response.headers["Content-Disposition"]).to include("attachment", "employees-")
      expect(response.body.lines.size).to eq(2)
      expect(response.body).to include("Liam")
      expect(response.body).not_to include("Asha")
    end
  end

  describe "POST /api/employees/import" do
    it "imports the uploaded file and reports what happened" do
      csv = "#{EmployeeCsv::COLUMNS.join(',')}\n" \
            ",Kiran,Shah,kiran.shah@acme.test,Data Analyst,Data,IN,1500000,full_time,2023-01-15\n"

      post "/api/employees/import", params: { file: upload(csv) }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("created" => 1, "updated" => 0, "errors" => [])
    end

    it "asks for a file when none is sent" do
      post "/api/employees/import"

      expect(response).to have_http_status(:bad_request)
    end
  end
end
