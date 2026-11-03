require "rails_helper"

RSpec.describe RaiseSimulation do
  before do
    create(:employee, country_code: "IN", department: "Engineering", salary: 1_000_000)
    create(:employee, country_code: "IN", department: "Engineering", salary: 2_000_000)
    create(:employee, country_code: "IN", department: "Sales", salary: 500_000)
    create(:employee, country_code: "US", department: "Engineering", salary: 100_000)
  end

  it "costs a raise for everyone matching the filters, in local currency and USD" do
    result = described_class.new(percent: 10, country_code: "IN", department: "Engineering").call

    expect(result).to include(affected_headcount: 2, raise_cost_usd: 3_409) # 300,000 INR / 88
    expect(result[:by_country]).to eq([
      { country_code: "IN", currency: "INR", headcount: 2,
        current_payroll: 3_000_000, raise_cost: 300_000, raise_cost_usd: 3_409 }
    ])
  end

  it "applies to the whole org when no filters are given" do
    result = described_class.new(percent: 5).call

    expect(result[:affected_headcount]).to eq(4)
    expect(result[:by_country].map { |c| c[:country_code] }).to contain_exactly("IN", "US")
  end

  it "supports fractional percentages, rounding each raise to whole units" do
    result = described_class.new(percent: 2.5, country_code: "US").call

    expect(result[:by_country].first[:raise_cost]).to eq(2_500)
  end

  it "reports the new payroll after the raise" do
    result = described_class.new(percent: 10, country_code: "US").call

    expect(result).to include(current_payroll_usd: 100_000, new_payroll_usd: 110_000)
  end

  it "never changes anyone's salary" do
    expect { described_class.new(percent: 50).call }.not_to(change { Employee.order(:id).pluck(:salary) })
  end

  it "rejects a percentage outside 0-100" do
    expect { described_class.new(percent: 0).call }.to raise_error(ArgumentError, /between 0 and 100/)
    expect { described_class.new(percent: 101).call }.to raise_error(ArgumentError, /between 0 and 100/)
  end
end
