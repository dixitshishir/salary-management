require "rails_helper"

RSpec.describe "Employee CSV round trip" do
  let(:header) { EmployeeCsv::COLUMNS.join(",") }

  def csv(*rows) = ([ header ] + rows).join("\n")

  describe EmployeeCsv::Export do
    it "writes a header and one row per employee, in import-compatible columns" do
      create(:employee, employee_code: "EMP-00001", first_name: "Asha", country_code: "IN", salary: 1_800_000)

      lines = described_class.new(Employee.all).call.lines(chomp: true)

      expect(lines.first).to eq("#{header},currency,salary_usd")
      expect(lines.second).to start_with("EMP-00001,Asha,Rao,")
      expect(lines.second).to end_with(",INR,20455")
    end

    it "neutralises spreadsheet formulas so the file is safe to open in Excel" do
      create(:employee, first_name: "=HYPERLINK(\"http://evil\")")

      expect(described_class.new(Employee.all).call).to include("'=HYPERLINK")
    end
  end

  describe EmployeeCsv::Import do
    let(:row) { "EMP-00100,Kiran,Shah,kiran.shah@acme.test,Data Analyst,Data,IN,1500000,full_time,2023-01-15" }

    it "creates employees from new codes" do
      result = described_class.new(csv(row)).call

      expect(result.to_h).to include(created: 1, updated: 0, errors: [])
      expect(Employee.find_by(employee_code: "EMP-00100").salary).to eq(1_500_000)
    end

    it "updates employees whose code already exists, recording the salary change" do
      existing = create(:employee, employee_code: "EMP-00100", email: "kiran.shah@acme.test", salary: 1_000_000)

      result = described_class.new(csv(row)).call

      expect(result.to_h).to include(created: 0, updated: 1)
      expect(existing.reload.salary).to eq(1_500_000)
      expect(existing.salary_revisions.order(:id).last.reason).to eq("CSV import")
    end

    it "reports invalid rows by line number and still imports the valid ones" do
      bad = "EMP-00101,,Shah,bad-email,Data Analyst,Data,XX,-1,full_time,2023-01-15"

      result = described_class.new(csv(row, bad)).call

      expect(result.created).to eq(1)
      expect(result.errors.size).to eq(1)
      expect(result.errors.first).to include(line: 3, employee_code: "EMP-00101")
      expect(result.errors.first[:messages]).to include("First name can't be blank")
    end

    it "rejects a file that is missing required columns before touching any data" do
      result = described_class.new("first_name,last_name\nAsha,Rao").call

      expect(result.errors).to match([ { line: 1, employee_code: nil, messages: [ a_string_matching(/Missing columns: employee_code/) ] } ])
      expect(Employee.count).to eq(0)
    end

    it "accepts the file it exported and reports nothing changed" do
      create_list(:employee, 3)
      exported = EmployeeCsv::Export.new(Employee.all).call

      result = described_class.new(exported).call

      expect(result.to_h).to include(created: 0, updated: 0, unchanged: 3, errors: [])
    end

    it "reports an unparseable hire date as a row error" do
      result = described_class.new(csv(row.sub("2023-01-15", "15/01/2023"))).call

      expect(result.errors.first[:messages]).to include("Hire date must be a date in YYYY-MM-DD format")
    end
  end
end
