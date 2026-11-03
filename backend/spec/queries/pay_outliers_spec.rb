require "rails_helper"

RSpec.describe PayOutliers do
  # Five Software Engineers in India; the peer median is 1,000,000 INR.
  let!(:low)    { create(:employee, country_code: "IN", salary: 700_000) }   # 0.70 of median
  let!(:normal) { create(:employee, country_code: "IN", salary: 950_000) }
  let!(:median) { create(:employee, country_code: "IN", salary: 1_000_000) }
  let!(:fine)   { create(:employee, country_code: "IN", salary: 1_100_000) }
  let!(:high)   { create(:employee, country_code: "IN", salary: 1_500_000) } # 1.50 of median

  it "flags employees paid more than the threshold away from their peer median" do
    result = described_class.new(threshold: 0.2).call

    expect(result[:outliers].map { |o| o[:employee][:id] }).to contain_exactly(low.id, high.id)
  end

  it "explains each flag with the peer median, compa-ratio and direction" do
    flagged_low = described_class.new(threshold: 0.2).call[:outliers].find { |o| o[:employee][:id] == low.id }

    expect(flagged_low).to include(peer_median: 1_000_000, compa_ratio: 0.7, direction: "below", peer_count: 5)
  end

  it "lists the furthest from the median first" do
    ids = described_class.new(threshold: 0.2).call[:outliers].map { |o| o[:employee][:id] }

    expect(ids).to eq([ high.id, low.id ])
  end

  it "compares people only with the same job title in the same country" do
    create(:employee, country_code: "IN", job_title: "Engineering Manager", salary: 3_000_000)
    create(:employee, country_code: "US", salary: 150_000)

    expect(described_class.new(threshold: 0.2).call[:outliers].size).to eq(2)
  end

  it "skips peer groups too small for a meaningful median" do
    Employee.where.not(id: [ low.id, high.id ]).destroy_all

    expect(described_class.new(threshold: 0.2).call[:outliers]).to be_empty
  end

  it "can be narrowed to one country" do
    expect(described_class.new(threshold: 0.2, country_code: "US").call[:outliers]).to be_empty
  end

  it "reports the total even when the list is truncated" do
    result = described_class.new(threshold: 0.2, limit: 1).call

    expect(result[:outliers].size).to eq(1)
    expect(result[:total_count]).to eq(2)
  end
end
