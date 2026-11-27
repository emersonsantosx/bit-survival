package com.bitsurvival.app;

import android.graphics.Rect;
import android.os.Build;
import android.view.DisplayCutout;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Ajustes de tela do app: tela sempre acesa, tela cheia imersiva usando tambem a area da camera, e aviso ao jogo (android/app.js)
 * de quanto a camera ocupa em cada lado e de quanto o teclado cobre, tudo em px do jogo.
 */
public class BitApp extends CordovaPlugin {
    private CallbackContext ouvinte;
    private String ultimo = "";

    @Override
    protected void pluginInitialize() {
        cordova.getActivity().runOnUiThread(() -> {
            Window janela = cordova.getActivity().getWindow();
            janela.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams p = janela.getAttributes();
                p.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                janela.setAttributes(p);
            }
            telaCheia();
            View raiz = janela.getDecorView();
            raiz.getViewTreeObserver().addOnGlobalLayoutListener(() -> avisar(false));
            raiz.setOnApplyWindowInsetsListener((v, insets) -> {
                v.post(() -> avisar(false));
                return v.onApplyWindowInsets(insets);
            });
        });
    }

    @Override
    public void onResume(boolean multitasking) {
        super.onResume(multitasking);
        cordova.getActivity().runOnUiThread(this::telaCheia);
    }

    /** Esconde as barras do sistema; deslizar na borda mostra as barras por um instante. */
    @SuppressWarnings("deprecation")
    private void telaCheia() {
        cordova.getActivity().getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        if (!"observar".equals(action)) {
            return false;
        }
        cordova.getActivity().runOnUiThread(() -> {
            ouvinte = callbackContext;
            avisar(true);
        });
        return true;
    }

    private void avisar(boolean sempre) {
        if (ouvinte == null) {
            return;
        }
        View raiz = cordova.getActivity().getWindow().getDecorView();
        int altura = raiz.getHeight();
        if (altura <= 0) {
            return;
        }
        int esq = 0;
        int dir = 0;
        int teclado = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            WindowInsets insets = raiz.getRootWindowInsets();
            if (insets != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                DisplayCutout recorte = insets.getDisplayCutout();
                if (recorte != null) {
                    esq = recorte.getSafeInsetLeft();
                    dir = recorte.getSafeInsetRight();
                }
            }
            if (insets != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    && insets.isVisible(WindowInsets.Type.ime())) {
                teclado = insets.getInsets(WindowInsets.Type.ime()).bottom;
            }
        }
        // Android mais antigo: o teclado aparece como a parte de baixo que deixou de ser visivel
        Rect visivel = new Rect();
        raiz.getWindowVisibleDisplayFrame(visivel);
        int coberto = altura - visivel.bottom;
        if (coberto > altura / 5) {
            teclado = Math.max(teclado, coberto);
        }
        float densidade = cordova.getActivity().getResources().getDisplayMetrics().density;
        try {
            JSONObject o = new JSONObject();
            o.put("esq", Math.ceil(esq / densidade));
            o.put("dir", Math.ceil(dir / densidade));
            o.put("teclado", Math.round(teclado / densidade));
            o.put("altura", Math.round(altura / densidade));
            String texto = o.toString();
            if (!sempre && texto.equals(ultimo)) {
                return;
            }
            ultimo = texto;
            PluginResult resposta = new PluginResult(PluginResult.Status.OK, o);
            resposta.setKeepCallback(true);
            ouvinte.sendPluginResult(resposta);
        } catch (JSONException e) {
            // sem os numeros o jogo continua com margem zero
        }
    }
}
