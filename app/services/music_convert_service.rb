class MusicConvertService < BaseService
  def call(track, resolution)
    Tempfile.create do |music_file|
      track.music.copy_to_local_file :original, music_file.path

      image_file = nil
      begin
        if track.video_image.present?
          image_file = Tempfile.new
          track.video_image.copy_to_local_file :original, image_file.path
        end

        IO.pipe do |video_readable, video_writable|
          musicvideo_pid = create_musicvideo(track, resolution, music_file, image_file, video_writable)

          begin
            video_file = Tempfile.new(['music-', '.mp4'])
            begin
              mp4_pid = create_mp4(track, resolution, music_file, video_readable, video_file)

              begin
                musicvideo_thread = Thread.new do
                  Process.waitpid musicvideo_pid

                  if $?.success?
                    video_writable.close
                  else
                    begin
                      Process.kill 'SIGTERM', mp4_pid
                    rescue Errno::ESRCH
                    end

                    video_writable.close
                    raise Mastodon::MusicvideoError, $?.inspect
                  end
                end

                begin
                  mp4_thread = Thread.new do
                    Process.waitpid mp4_pid

                    if $?.success?
                      video_readable.close
                    else
                      begin
                        Process.kill 'SIGTERM', musicvideo_pid
                      rescue Errno::ESRCH
                      end

                      video_readable.close
                      raise Mastodon::FFmpegError, $?.inspect
                    end
                  end

                  mp4_thread.join 32.minutes
                  video_file
                ensure
                  musicvideo_thread.join 1.minute
                end
              rescue
                begin
                  Process.kill 'SIGKILL', mp4_pid
                  Process.waitpid mp4_pid
                rescue Errno::ESRCH
                end

                raise
              end
            rescue
              video_file.unlink
              raise
            end
          rescue
            begin
              Process.kill 'SIGKILL', musicvideo_pid
              Process.waitpid musicvideo_pid
            rescue Errno::ESRCH
            end

            raise
          end
        end
      ensure
        image_file&.unlink
      end
    end
  end

  private

  def create_musicvideo(track, resolution, music_file, image_file, video_file)
    args = [
      Rails.root.join('node_modules', '.bin', 'electron'), 'genmv', '--',
      music_file.path, '--resolution', resolution,
      '--backgroundcolor', track.video_backgroundcolor, '--image',
      if image_file.nil?
        Rails.root.join('app', 'javascript', 'images', 'pawoo_music', 'default_artwork.png')
      else
        image_file.path
      end,
    ]

    if track.video_banner_alpha != 0
      args.push(
        '--banner-image', Rails.root.join('app', 'made-with-pawoomusic.png'),
        '--banner-alpha', track.video_banner_alpha
      )
    end

    if track.video_text_alpha != 0
      args.push(
        '--text-alpha', track.video_text_alpha,
        '--text-color', track.video_text_color,
        '--text-title', track.title, '--text-sub', track.artist
      )
    end

    if track.video_blur_movement_band_top != 0 && track.video_blur_blink_band_top != 0
      args.push(
        '--blur-movement-band-top', track.video_blur_movement_band_top,
        '--blur-movement-band-bottom', track.video_blur_movement_band_bottom,
        '--blur-movement-threshold', track.video_blur_movement_threshold,
        '--blur-blink-band-top', track.video_blur_blink_band_top,
        '--blur-blink-band-bottom', track.video_blur_blink_band_bottom,
        '--blur-blink-threshold', track.video_blur_blink_threshold,
      )
    end

    if track.video_particle_alpha != 0
      args.push(
        '--particle-limit-band-top', track.video_particle_limit_band_top,
        '--particle-limit-band-bottom', track.video_particle_limit_band_bottom,
        '--particle-limit-threshold', track.video_particle_limit_threshold,
        '--particle-alpha', track.video_particle_alpha,
        '--particle-color', track.video_particle_color,
      )
    end

    if track.video_lightleaks_alpha != 0
      args.push '--lightleaks-alpha', track.video_lightleaks_alpha
      args.push '--lightleaks-interval', track.video_lightleaks_interval
    end

    if track.video_spectrum_alpha != 0
      args.push(
        '--spectrum-mode', track.video_spectrum_mode,
        '--spectrum-alpha', track.video_spectrum_alpha,
        '--spectrum-color', track.video_spectrum_color,
      )
    end

    spawn *args.map(&:to_s), out: video_file
  end

  def create_mp4(track, resolution, music_file, musicvideo, video_file)
    spawn(
      'ffmpeg', '-y', '-i', music_file.path, '-f', 'rawvideo',
      '-framerate', '30', '-pixel_format', 'bgr32', '-video_size', resolution,
      '-i', 'pipe:', '-vf', 'format=yuv420p,vflip', '-metadata',
      "title=#{track.title}", '-metadata', "artist=#{track.artist}",
      *Rails.configuration.x.ffmpeg_options, video_file.path, in: musicvideo
    )
  end
end
