require "rails_helper"

RSpec.describe "Employees API" do
  let(:json) { response.parsed_body }

  describe "GET /api/employees" do
    it "returns a page of employees with pagination metadata" do
      create_list(:employee, 3)

      get "/api/employees", params: { per_page: 2, page: 2 }

      expect(response).to have_http_status(:ok)
      expect(json["data"].size).to eq(1)
      expect(json["meta"]).to eq("page" => 2, "per_page" => 2, "total_count" => 3, "total_pages" => 2)
    end

    it "includes currency and USD salary so the UI needs no rate table" do
      create(:employee, country_code: "IN", salary: 8_800_000)

      get "/api/employees"

      expect(json["data"].first).to include("currency" => "INR", "salary" => 8_800_000, "salary_usd" => 100_000,
                                            "country_name" => "India")
    end

    it "caps per_page so a single request cannot pull all 10k rows" do
      get "/api/employees", params: { per_page: 5_000 }

      expect(json["meta"]["per_page"]).to eq(100)
    end

    it "searches across name, email and employee code, one term at a time" do
      asha = create(:employee, first_name: "Asha", last_name: "Rao")
      create(:employee, first_name: "Asha", last_name: "Menon")
      create(:employee, first_name: "Ravi", last_name: "Rao")

      get "/api/employees", params: { q: "asha rao" }

      expect(json["data"].map { |e| e["id"] }).to eq([ asha.id ])
    end

    it "treats SQL wildcards in the search as literal text" do
      create(:employee, first_name: "Asha")

      get "/api/employees", params: { q: "%" }

      expect(json["data"]).to be_empty
    end

    it "filters by country, department and job title" do
      match = create(:employee, country_code: "US", department: "Sales", job_title: "Account Manager")
      create(:employee, country_code: "US", department: "Engineering")
      create(:employee, country_code: "IN", department: "Sales", job_title: "Account Manager")

      get "/api/employees", params: { country_code: "US", department: "Sales", job_title: "Account Manager" }

      expect(json["data"].map { |e| e["id"] }).to eq([ match.id ])
    end

    it "sorts by an allowed column and ignores anything else" do
      low = create(:employee, salary: 100)
      high = create(:employee, salary: 900)

      get "/api/employees", params: { sort: "salary", direction: "desc" }
      expect(json["data"].map { |e| e["id"] }).to eq([ high.id, low.id ])

      get "/api/employees", params: { sort: "salary; DROP TABLE employees", direction: "sideways" }
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /api/employees/:id" do
    it "returns the employee with their salary history, newest first" do
      employee = create(:employee, salary: 1_000)
      employee.update!(salary: 1_100, salary_change_reason: "Promotion")

      get "/api/employees/#{employee.id}"

      expect(json["salary_revisions"].map { |r| r.slice("previous_salary", "new_salary", "reason") }).to eq([
        { "previous_salary" => 1_000, "new_salary" => 1_100, "reason" => "Promotion" },
        { "previous_salary" => nil, "new_salary" => 1_000, "reason" => "Hired" }
      ])
    end

    it "returns 404 for an unknown employee" do
      get "/api/employees/999999"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/employees" do
    let(:valid_params) do
      { employee: attributes_for(:employee, employee_code: nil, email: "new.hire@acme.test") }
    end

    it "creates an employee and assigns a code" do
      post "/api/employees", params: valid_params

      expect(response).to have_http_status(:created)
      expect(json["employee_code"]).to match(/\AEMP-\d{5}\z/)
    end

    it "returns field errors for invalid input" do
      post "/api/employees", params: { employee: { first_name: "" } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to include("first_name", "salary", "country_code")
    end
  end

  describe "PATCH /api/employees/:id" do
    it "updates salary and records the reason" do
      employee = create(:employee, salary: 1_000)

      patch "/api/employees/#{employee.id}", params: { employee: { salary: 1_200, salary_change_reason: "Market adjustment" } }

      expect(response).to have_http_status(:ok)
      expect(employee.salary_revisions.order(:id).last.reason).to eq("Market adjustment")
    end

    it "returns field errors for invalid changes" do
      employee = create(:employee)

      patch "/api/employees/#{employee.id}", params: { employee: { salary: -5 } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]["salary"]).to be_present
    end
  end

  describe "DELETE /api/employees/:id" do
    it "removes the employee and their history" do
      employee = create(:employee)

      expect { delete "/api/employees/#{employee.id}" }.to change(Employee, :count).by(-1)
                                                      .and change(SalaryRevision, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
