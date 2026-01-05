using backend.Domain.Meetings;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure;

public class AppDbContext : DbContext
{
	public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

	// 🔹 Befintlig analys (behåll!)
	public DbSet<MeetingAnalysis> MeetingAnalyses => Set<MeetingAnalysis>();

	// 🔹 Nya entiteter för transkribering
	public DbSet<Meeting> Meetings => Set<Meeting>();
	public DbSet<Transcript> Transcripts => Set<Transcript>();
	public DbSet<TranscriptSegment> TranscriptSegments => Set<TranscriptSegment>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		base.OnModelCreating(modelBuilder);

		modelBuilder.Entity<Meeting>()
		  .HasOne(m => m.Transcript)
		  .WithOne(t => t.Meeting)
		  .HasForeignKey<Transcript>(t => t.MeetingId)
		  .OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Transcript>()
		  .HasMany(t => t.Segments)
		  .WithOne(s => s.Transcript)
		  .HasForeignKey(s => s.TranscriptId)
		  .OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<TranscriptSegment>()
		  .HasIndex(s => new { s.TranscriptId, s.SegmentIndex })
		  .IsUnique();

		modelBuilder.Entity<MeetingAnalysis>()
		  .HasOne(a => a.Meeting)
		  .WithMany()
		  .HasForeignKey(a => a.MeetingId)
		  .OnDelete(DeleteBehavior.SetNull);
	}
}
