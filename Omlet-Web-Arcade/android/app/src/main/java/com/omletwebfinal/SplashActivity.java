package com.omletwebfinal;

import android.app.Activity; // <-- CAMBIO #1: Importar la clase base 'Activity'
import android.content.Intent;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.VideoView;

// import androidx.appcompat.app.AppCompatActivity; // <-- CAMBIO #2: Ya no necesitamos esta

public class SplashActivity extends Activity { // <-- CAMBIO #3: Heredar de 'Activity'

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Poner la actividad en pantalla completa
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_splash);

        // ¡ELIMINAMOS LA LÓGICA DE LA ACTION BAR!
        // La clase base 'Activity' con un tema NoActionBar no tiene ActionBar por defecto.
        // if (getSupportActionBar() != null) {
        //     getSupportActionBar().hide();
        // }

        VideoView videoView = findViewById(R.id.video_view);

        // Construir la ruta al video en la carpeta 'raw'
        Uri videoUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.splash_video);
        videoView.setVideoURI(videoUri);

        // Configurar un listener para cuando el video termine
        videoView.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
            public void onCompletion(MediaPlayer mp) {
                // Iniciar la actividad principal de Capacitor
                startMainActivity();
            }
        });

        // Empezar a reproducir el video
        videoView.start();
    }

    private void startMainActivity() {
        Intent intent = new Intent(SplashActivity.this, MainActivity.class);
        startActivity(intent);

        // Finalizamos la SplashActivity
        finish();
    }
}