using backend.Domain.Meetings;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure;

public class AppDbContext : DbContext
{
	public AppDbContext(DbContextOptions<AppDbContext> options)
		: base(options)
	{
	}

	public DbSet<MeetingAnalysis> MeetingAnalyses => Set<MeetingAnalysis>();
}