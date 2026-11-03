require "rails_helper"

RSpec.describe PayInsights do
  subject(:insights) { described_class.new }

  def hire(country_code, salary, job_title: "Software Engineer", department: "Engineering")
    create(:employee, country_code:, salary:, job_title:, department:)
  end

  describe "#by_country" do
    it "summarises pay per country in local currency, with USD alongside" do
      hire("IN", 1_000_000)
      hire("IN", 2_000_000)
      hire("IN", 6_000_000)
      hire("US", 120_000)

      india = insights.by_country.find { |row| row[:country_code] == "IN" }

      expect(india).to include(country_name: "India", currency: "INR", headcount: 3,
                               min: 1_000_000, max: 6_000_000, mean: 3_000_000, median: 2_000_000)
      expect(india[:median_usd]).to eq(22_727) # 2,000,000 INR / 88
    end

    it "orders countries by headcount, largest first" do
      hire("US", 100_000)
      2.times { hire("IN", 1_000_000) }

      expect(insights.by_country.map { |row| row[:country_code] }).to eq(%w[IN US])
    end

    it "is empty when there are no employees" do
      expect(insights.by_country).to eq([])
    end
  end

  describe "#by_job_title" do
    it "summarises pay per job title within one country only" do
      hire("IN", 1_000_000, job_title: "Software Engineer")
      hire("IN", 1_400_000, job_title: "Software Engineer")
      hire("IN", 3_000_000, job_title: "Engineering Manager")
      hire("US", 150_000, job_title: "Software Engineer")

      rows = insights.by_job_title("IN")

      expect(rows.map { |row| row.slice(:job_title, :headcount, :median) }).to contain_exactly(
        { job_title: "Software Engineer", headcount: 2, median: 1_200_000 },
        { job_title: "Engineering Manager", headcount: 1, median: 3_000_000 }
      )
    end
  end

  describe "#overview" do
    it "totals headcount and payroll across countries in USD" do
      hire("IN", 8_800_000)                         # 100,000 USD
      hire("US", 50_000, department: "Sales")       #  50,000 USD

      overview = insights.overview

      expect(overview).to include(headcount: 2, country_count: 2, total_payroll_usd: 150_000, median_salary_usd: 75_000)
      expect(overview[:rates_as_of]).to eq(Date.new(2026, 11, 1))
    end

    it "breaks payroll down by department in USD, largest payroll first" do
      hire("IN", 8_800_000, department: "Engineering")
      hire("US", 50_000, department: "Sales")
      hire("US", 70_000, department: "Sales")

      departments = insights.overview[:departments]

      expect(departments.map { |d| d.slice(:department, :headcount, :total_payroll_usd) }).to eq([
        { department: "Sales", headcount: 2, total_payroll_usd: 120_000 },
        { department: "Engineering", headcount: 1, total_payroll_usd: 100_000 }
      ])
    end
  end
end
