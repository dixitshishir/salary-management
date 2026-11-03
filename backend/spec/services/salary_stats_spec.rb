require "rails_helper"

RSpec.describe SalaryStats do
  describe "for an empty list" do
    subject(:stats) { described_class.new([]) }

    it "reports a zero count and no values" do
      expect(stats.to_h).to eq(count: 0, total: 0, min: nil, max: nil, mean: nil, median: nil, p25: nil, p75: nil)
    end
  end

  describe "for a single salary" do
    subject(:stats) { described_class.new([50_000]) }

    it "uses that salary for every statistic" do
      expect(stats.to_h).to eq(count: 1, total: 50_000, min: 50_000, max: 50_000,
                               mean: 50_000, median: 50_000, p25: 50_000, p75: 50_000)
    end
  end

  it "does not depend on input order" do
    expect(described_class.new([30, 10, 20]).to_h).to eq(described_class.new([10, 20, 30]).to_h)
  end

  it "takes the middle value as the median of an odd-sized list" do
    expect(described_class.new([10, 90, 20]).median).to eq(20)
  end

  it "averages the two middle values for an even-sized list" do
    expect(described_class.new([10, 20, 30, 40]).median).to eq(25)
  end

  it "interpolates quartiles between neighbours, like percentile_cont" do
    stats = described_class.new([10, 20, 30, 40])

    expect(stats.p25).to eq(18) # 17.5, rounded half up
    expect(stats.p75).to eq(33) # 32.5, rounded half up
  end

  it "rounds the mean to whole currency units" do
    expect(described_class.new([1, 2]).mean).to eq(2)
  end

  it "keeps the mean and median apart when one salary skews the list" do
    stats = described_class.new([40_000, 45_000, 50_000, 1_000_000])

    expect(stats.mean).to eq(283_750)
    expect(stats.median).to eq(47_500)
  end
end
