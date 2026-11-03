require "rails_helper"

RSpec.describe EmployeeSeeder do
  def snapshot
    Employee.order(:employee_code).pluck(:employee_code, :first_name, :last_name, :email, :job_title,
                                         :department, :country_code, :salary, :employment_type, :hire_date)
  end

  it "creates the requested number of employees" do
    expect { described_class.new(count: 120).call }.to change(Employee, :count).by(120)
  end

  it "produces the same employees for the same seed" do
    described_class.new(count: 50, seed: 7).call
    first_run = snapshot

    described_class.new(count: 50, seed: 7).call

    expect(snapshot).to eq(first_run)
  end

  it "replaces existing employees instead of appending to them" do
    create(:employee)

    described_class.new(count: 10).call

    expect(Employee.count).to eq(10)
  end

  it "only generates employees that pass model validation" do
    described_class.new(count: 200).call

    invalid = Employee.all.reject(&:valid?)
    expect(invalid.map { |e| [ e.employee_code, e.errors.full_messages ] }).to be_empty
  end

  it "gives every employee a unique, sequential code" do
    described_class.new(count: 3).call

    expect(Employee.order(:employee_code).pluck(:employee_code)).to eq(%w[EMP-00001 EMP-00002 EMP-00003])
  end

  it "spreads employees across every country we operate in" do
    described_class.new(count: 500).call

    expect(Employee.distinct.pluck(:country_code)).to match_array(Country.codes)
  end

  it "leaves a realistic minority of employees off their pay band" do
    described_class.new(count: 2_000).call

    flagged = PayOutliers.new(threshold: 0.2).call[:total_count]

    expect(flagged.fdiv(2_000)).to be_between(0.01, 0.08)
  end

  it "pays senior roles more than junior ones in the same country, on average" do
    described_class.new(count: 2_000).call
    india = Employee.where(country_code: "IN")

    expect(india.where(job_title: "Senior Software Engineer").average(:salary))
      .to be > india.where(job_title: "Software Engineer").average(:salary)
  end
end
